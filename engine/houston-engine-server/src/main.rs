//! `houston-engine` binary entry point.
//!
//! Reads config from env, binds a TCP listener, writes `engine.json` to the
//! Houston home dir so the desktop supervisor can discover `{port, pid,
//! token_hash, version}`, and serves the full router.

use houston_engine_protocol::{ENGINE_VERSION, PROTOCOL_VERSION};
use houston_engine_server::{build_router, ServerConfig, ServerState};
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
    let cfg = ServerConfig::from_env();
    let listener = TcpListener::bind(cfg.bind)
        .await
        .expect("bind failed");
    let actual: SocketAddr = listener.local_addr().expect("local_addr");

    write_manifest(&cfg, actual.port());

    // Emit the port on stdout so the desktop supervisor can parse it.
    println!("HOUSTON_ENGINE_LISTENING port={} token={}", actual.port(), cfg.token);
    tracing::info!(
        "houston-engine {} (protocol v{}) listening on {}",
        ENGINE_VERSION,
        PROTOCOL_VERSION,
        actual
    );

    let state = Arc::new(
        ServerState::new(cfg)
            .await
            .expect("engine state init failed"),
    );
    let app = build_router(state);

    if let Err(err) = axum::serve(listener, app).await {
        tracing::error!("server error: {err}");
        std::process::exit(1);
    }
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
