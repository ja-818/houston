//! `houston-engine` binary entry point.
//!
//! Reads config from env, binds a TCP listener, writes `engine.json` to the
//! Houston home dir so the desktop supervisor can discover `{port, pid,
//! token_hash, version}`, and serves the full router.

use houston_engine_protocol::{ENGINE_VERSION, PROTOCOL_VERSION};
use houston_engine_server::{build_router, ServerConfig, ServerState};
use houston_tunnel::{EngineEndpoint, TunnelClient, TunnelConfig};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

#[derive(Serialize)]
struct EngineManifest<'a> {
    version: &'a str,
    protocol: u8,
    port: u16,
    pid: u32,
    token_hash: String,
}

#[tokio::main]
async fn main() {
    init_tracing();

    // PATH resolution runs `zsh -l -c 'echo $PATH'` + scans install dirs
    // (~0.5-2s). Previously we did it here synchronously, which blocked
    // the main thread until finished and delayed the `HOUSTON_ENGINE_LISTENING`
    // banner — so the Tauri supervisor saw a longer startup and the
    // "Starting Houston engine…" splash lingered. Kick it off on a
    // blocking thread so bind/banner happen immediately, then await the
    // result before `axum::serve` starts accepting so no route handler
    // can read an unresolved PATH.
    let path_init = tokio::task::spawn_blocking(|| {
        houston_terminal_manager::claude_path::init();
    });

    let cfg = ServerConfig::from_env();
    let listener = TcpListener::bind(cfg.bind)
        .await
        .expect("bind failed");
    let actual: SocketAddr = listener.local_addr().expect("local_addr");

    write_manifest(&cfg, actual.port());

    // Emit the port on stdout so the desktop supervisor can parse it.
    // Must print BEFORE any potentially-slow work so the supervisor's
    // banner-wait timer doesn't race startup.
    println!("HOUSTON_ENGINE_LISTENING port={} token={}", actual.port(), cfg.token);
    tracing::info!(
        "houston-engine {} (protocol v{}) listening on {}",
        ENGINE_VERSION,
        PROTOCOL_VERSION,
        actual
    );

    // Tunnel identity: cached in `<home>/tunnel.json`, or allocated on
    // first boot via `POST {relay}/allocate`. Failure is non-fatal — the
    // engine keeps serving local traffic; mobile companion + push stay
    // dormant until the next boot succeeds.
    let tunnel_identity =
        match houston_tunnel::ensure(&cfg.home_dir, &cfg.tunnel_url).await {
            Ok(identity) => {
                tracing::info!(
                    target: "houston_tunnel",
                    tunnel_id = %identity.tunnel_id,
                    host = %identity.public_host,
                    "tunnel identity loaded"
                );
                Some(identity)
            }
            Err(e) => {
                tracing::warn!(
                    target: "houston_tunnel",
                    error = %e,
                    "tunnel allocation failed — running local-only, pairing disabled until next boot"
                );
                None
            }
        };

    let state = ServerState::new(cfg, tunnel_identity)
        .await
        .expect("engine state init failed");

    let state = Arc::new(state);

    // Spawn the tunnel client if identity allocated. Needs the engine
    // port, which we know now.
    spawn_tunnel_if_allocated(state.clone(), actual.port());

    let app = build_router(state);

    // Block on PATH resolution just before serving. DB init usually
    // takes longer than `zsh -l`, so this await is typically a no-op.
    // If PATH init panicked, log and continue with whatever the OnceLock
    // holds — routes fall back to the process PATH, which is degraded
    // but not fatal.
    if let Err(e) = path_init.await {
        tracing::warn!("[boot] claude_path::init panicked: {e}");
    }

    if let Err(err) = axum::serve(listener, app).await {
        tracing::error!("server error: {err}");
        std::process::exit(1);
    }
}

fn spawn_tunnel_if_allocated(state: Arc<ServerState>, engine_port: u16) {
    let Some(identity) = state.tunnel_identity.clone() else { return };
    let cfg = TunnelConfig {
        home_dir: state.config.home_dir.clone(),
        tunnel_url: state.config.tunnel_url.clone(),
        identity,
        endpoint: EngineEndpoint::new(engine_port),
    };
    let client = TunnelClient::new(cfg, Arc::new(state.pair_store.clone()));
    state
        .tunnel_running
        .store(true, std::sync::atomic::Ordering::Relaxed);
    tokio::spawn(async move {
        client.run().await;
    });
}

fn init_tracing() {
    use tracing_subscriber::{fmt, EnvFilter};
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,houston=debug"));
    fmt().with_env_filter(filter).with_target(false).init();
}

fn write_manifest(cfg: &ServerConfig, port: u16) {
    let path = cfg.home_dir.join("engine.json");
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let mut hasher = Sha256::new();
    hasher.update(cfg.token.as_bytes());
    let token_hash = format!("{:x}", hasher.finalize());
    let manifest = EngineManifest {
        version: ENGINE_VERSION,
        protocol: PROTOCOL_VERSION,
        port,
        pid: std::process::id(),
        token_hash,
    };
    if let Ok(json) = serde_json::to_string_pretty(&manifest) {
        let _ = std::fs::write(&path, json);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600));
        }
    }
}
