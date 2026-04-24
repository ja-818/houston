//! Integration tests for `/v1/tunnel` + device-token auth.

use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn spawn() -> (SocketAddr, String, Arc<ServerState>) {
    let token = "tun-test".to_string();
    let home = tempfile::TempDir::new().unwrap();
    let docs = tempfile::TempDir::new().unwrap();
    let cfg = ServerConfig {
        bind: "127.0.0.1:0".parse().unwrap(),
        token: token.clone(),
        home_dir: home.path().to_path_buf(),
        docs_dir: docs.path().to_path_buf(),
        app_system_prompt: String::new(),
        app_onboarding_prompt: String::new(),
        tunnel_url: "http://test.invalid".into(),
    };
    let listener = TcpListener::bind(cfg.bind).await.unwrap();
    let addr = listener.local_addr().unwrap();
    // `new_in_memory` sets `tunnel_identity: None`, which models the
    // "first boot, relay unreachable" state — pairing should 503, device
    // tokens still authenticate, status reports disconnected.
    let state = Arc::new(ServerState::new_in_memory(cfg).await.unwrap());
    let app = build_router(state.clone());
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    std::mem::forget(home);
    std::mem::forget(docs);
    (addr, token, state)
}

#[tokio::test]
async fn status_reports_disconnected_without_config() {
    let (addr, tok, _st) = spawn().await;
    let c = reqwest::Client::new();
    let res = c
        .get(format!("http://{addr}/v1/tunnel/status"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(res.status().is_success());
    let body: serde_json::Value = res.json().await.unwrap();
    assert_eq!(body["connected"], serde_json::json!(false));
    assert!(body["tunnelId"].is_null());
}

#[tokio::test]
async fn mint_pairing_503s_when_identity_not_allocated() {
    let (addr, tok, _st) = spawn().await;
    let c = reqwest::Client::new();
    let res = c
        .post(format!("http://{addr}/v1/tunnel/pairing"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert_eq!(res.status().as_u16(), 503);
}

#[tokio::test]
async fn devices_list_starts_empty() {
    let (addr, tok, _st) = spawn().await;
    let c = reqwest::Client::new();
    let res = c
        .get(format!("http://{addr}/v1/tunnel/devices"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(res.status().is_success());
    let body: serde_json::Value = res.json().await.unwrap();
    assert_eq!(body.as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn device_token_authenticates_requests() {
    // Simulate pairing happening out-of-band: insert a hashed token.
    let (addr, _bootstrap, st) = spawn().await;
    let device_token = "mobile-device-token-xxxxxxxxxxxxxxxx";
    let hash = houston_engine_server::auth::hash_hex(device_token);
    st.engine
        .db
        .insert_engine_token(&hash, "Julian's iPhone")
        .await
        .unwrap();

    let c = reqwest::Client::new();
    // Bootstrap token still works.
    let res = c
        .get(format!("http://{addr}/v1/tunnel/devices"))
        .bearer_auth(device_token)
        .send()
        .await
        .unwrap();
    assert!(res.status().is_success(), "device token rejected: {}", res.status());

    // Revoked device token fails.
    st.engine.db.revoke_engine_token(&hash).await.unwrap();
    let res = c
        .get(format!("http://{addr}/v1/tunnel/devices"))
        .bearer_auth(device_token)
        .send()
        .await
        .unwrap();
    assert_eq!(res.status().as_u16(), 401);
}

#[tokio::test]
async fn revoke_device_route() {
    let (addr, tok, st) = spawn().await;
    let device_token = "will-be-revoked-token-xxxxxxxxxxxxxxxx";
    let hash = houston_engine_server::auth::hash_hex(device_token);
    st.engine
        .db
        .insert_engine_token(&hash, "Old phone")
        .await
        .unwrap();

    let c = reqwest::Client::new();
    let res = c
        .post(format!("http://{addr}/v1/tunnel/devices/{hash}/revoke"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(res.status().is_success(), "{}", res.status());

    // After revoke, the paired device's token is dead.
    let res = c
        .get(format!("http://{addr}/v1/tunnel/devices"))
        .bearer_auth(device_token)
        .send()
        .await
        .unwrap();
    assert_eq!(res.status().as_u16(), 401);
}
