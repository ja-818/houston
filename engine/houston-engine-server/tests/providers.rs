//! Integration tests for `/v1/providers`.

use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn spawn() -> (SocketAddr, String) {
    let token = "provider-test".to_string();
    let cfg = ServerConfig {
        bind: "127.0.0.1:0".parse().unwrap(),
        token: token.clone(),
        home_dir: std::env::temp_dir(),
        docs_dir: std::env::temp_dir(),
        app_system_prompt: String::new(),
        app_onboarding_prompt: String::new(),
        tunnel_url: "http://test.invalid".into(),
    };
    let listener = TcpListener::bind(cfg.bind).await.unwrap();
    let addr = listener.local_addr().unwrap();
    let state = Arc::new(ServerState::new_in_memory(cfg).await.unwrap());
    let app = build_router(state);
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    (addr, token)
}

#[tokio::test]
async fn status_invalid_provider_rejected() {
    let (addr, tok) = spawn().await;
    let res = reqwest::Client::new()
        .get(format!("http://{addr}/v1/providers/gemini/status"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 400);
}

#[tokio::test]
async fn status_returns_shape_for_known_provider() {
    // CLI may or may not be installed in CI — assert shape only,
    // not the boolean values.
    let (addr, tok) = spawn().await;
    let body: serde_json::Value = reqwest::Client::new()
        .get(format!("http://{addr}/v1/providers/anthropic/status"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(body["provider"], "anthropic");
    assert_eq!(body["cliName"], "claude");
    assert!(body["cliInstalled"].is_boolean());
    assert!(body["authenticated"].is_boolean());
}

#[tokio::test]
async fn default_provider_roundtrip_via_generic_preferences() {
    // The default-provider preference rides on `/v1/preferences/:key`
    // (p2-a's slice). We verify the key agreed with `provider` module
    // is reachable through that surface.
    let (addr, tok) = spawn().await;
    let c = reqwest::Client::new();

    let get1: serde_json::Value = c
        .get(format!("http://{addr}/v1/preferences/default_provider"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert!(get1["value"].is_null());

    let put = c
        .put(format!("http://{addr}/v1/preferences/default_provider"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "value": "anthropic" }))
        .send()
        .await
        .unwrap();
    assert!(put.status().is_success());

    let get2: serde_json::Value = c
        .get(format!("http://{addr}/v1/preferences/default_provider"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(get2["value"], "anthropic");
}
