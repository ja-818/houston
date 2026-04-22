//! Integration tests for `/v1/sync` REST slice.
//!
//! Pointed at a bogus relay URL — the runner retries forever in the
//! background but the routes return the pairing info synchronously, so
//! we can exercise start/status/stop/send/auth without needing network.

use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn spawn() -> (SocketAddr, String) {
    let token = "stest".to_string();
    let docs = tempfile::TempDir::new().unwrap();
    let home = tempfile::TempDir::new().unwrap();
    let cfg = ServerConfig {
        bind: "127.0.0.1:0".parse().unwrap(),
        token: token.clone(),
        home_dir: home.path().to_path_buf(),
        docs_dir: docs.path().to_path_buf(),
        app_system_prompt: String::new(),
        app_onboarding_prompt: String::new(),
    };
    let listener = TcpListener::bind(cfg.bind).await.unwrap();
    let addr = listener.local_addr().unwrap();
    let state = Arc::new(ServerState::new_in_memory(cfg).await.unwrap());
    let app = build_router(state);
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    std::mem::forget(home);
    std::mem::forget(docs);
    (addr, token)
}

#[tokio::test]
async fn sync_lifecycle_over_rest() {
    let (addr, tok) = spawn().await;
    let c = reqwest::Client::new();

    // Auth required.
    let unauth = c.get(format!("http://{addr}/v1/sync")).send().await.unwrap();
    assert_eq!(unauth.status(), 401);

    // Status before start: null body.
    let st: serde_json::Value = c
        .get(format!("http://{addr}/v1/sync"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert!(st.is_null(), "expected null status, got {st}");

    // Send before start: 400.
    let sent = c
        .post(format!("http://{addr}/v1/sync/messages"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "type": "ping",
            "from": "desktop",
            "ts": "now",
            "payload": {}
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(sent.status(), 400);

    // Start with bogus relay so we don't touch the network.
    let info: serde_json::Value = c
        .post(format!("http://{addr}/v1/sync"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "relayUrl": "ws://127.0.0.1:1" }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    let token1 = info["token"].as_str().unwrap().to_string();
    assert!(info["pairingUrl"].as_str().unwrap().contains(&token1));

    // Status returns the same info.
    let st: serde_json::Value = c
        .get(format!("http://{addr}/v1/sync"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(st["token"], token1);

    // Idempotent restart returns the same token.
    let again: serde_json::Value = c
        .post(format!("http://{addr}/v1/sync"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "relayUrl": "ws://127.0.0.1:1" }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(again["token"], token1);

    // Stop, then status is null again.
    let del = c
        .delete(format!("http://{addr}/v1/sync"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(del.status().is_success());
    let st: serde_json::Value = c
        .get(format!("http://{addr}/v1/sync"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert!(st.is_null());
}
