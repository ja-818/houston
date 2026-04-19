//! Integration tests for `/v1/health`, `/v1/version`, and auth.

use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn spawn_test_server() -> (SocketAddr, String) {
    let token = "test-token-abc".to_string();
    let cfg = ServerConfig {
        bind: "127.0.0.1:0".parse().unwrap(),
        token: token.clone(),
        home_dir: std::env::temp_dir(),
        docs_dir: std::env::temp_dir(),
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
async fn health_unauthorized_without_token() {
    let (addr, _) = spawn_test_server().await;
    let res = reqwest::get(format!("http://{addr}/v1/health")).await.unwrap();
    assert_eq!(res.status(), 401);
}

#[tokio::test]
async fn health_authorized_with_bearer() {
    let (addr, token) = spawn_test_server().await;
    let res = reqwest::Client::new()
        .get(format!("http://{addr}/v1/health"))
        .bearer_auth(&token)
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 200);
    assert!(res.headers().get("x-houston-engine-version").is_some());
    let body: serde_json::Value = res.json().await.unwrap();
    assert_eq!(body["status"], "ok");
    assert_eq!(body["protocol"], 1);
}

#[tokio::test]
async fn version_endpoint() {
    let (addr, token) = spawn_test_server().await;
    let res = reqwest::Client::new()
        .get(format!("http://{addr}/v1/version"))
        .bearer_auth(&token)
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 200);
    let body: serde_json::Value = res.json().await.unwrap();
    assert_eq!(body["protocol"], 1);
}

#[tokio::test]
async fn query_token_also_works() {
    let (addr, token) = spawn_test_server().await;
    let res = reqwest::get(format!("http://{addr}/v1/health?token={token}"))
        .await
        .unwrap();
    assert_eq!(res.status(), 200);
}

#[tokio::test]
async fn ws_receives_broadcast_events() {
    use futures_util::StreamExt;
    use houston_ui_events::{EventSink, HoustonEvent};
    use tokio_tungstenite::{connect_async, tungstenite::client::IntoClientRequest};

    let token = "test-ws-token".to_string();
    let cfg = ServerConfig {
        bind: "127.0.0.1:0".parse().unwrap(),
        token: token.clone(),
        home_dir: std::env::temp_dir(),
        docs_dir: std::env::temp_dir(),
    };
    let listener = TcpListener::bind(cfg.bind).await.unwrap();
    let addr = listener.local_addr().unwrap();
    let state = Arc::new(ServerState::new_in_memory(cfg).await.unwrap());
    let events_sink = state.events.clone();
    let app = build_router(state);
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    let url = format!("ws://{addr}/v1/ws?token={token}");
    let mut req = url.into_client_request().unwrap();
    req.headers_mut().insert(
        "authorization",
        format!("Bearer {token}").parse().unwrap(),
    );
    let (mut ws, _) = connect_async(req).await.unwrap();

    // Give the socket a moment to subscribe before emitting.
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    events_sink.emit(HoustonEvent::ComposioCliReady);

    // Expect at least one frame within 2s.
    let recv = tokio::time::timeout(std::time::Duration::from_secs(2), ws.next()).await;
    assert!(recv.is_ok(), "timed out waiting for ws frame");
}
