//! Integration tests for `/v1/agent-configs`.

use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn spawn() -> (SocketAddr, String, tempfile::TempDir) {
    let token = "agent-configs-test".to_string();
    let home = tempfile::TempDir::new().unwrap();
    let docs = tempfile::TempDir::new().unwrap();
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
    std::mem::forget(docs);
    (addr, token, home)
}

#[tokio::test]
async fn list_empty_before_any_installed() {
    let (addr, tok, _home) = spawn().await;
    let body: serde_json::Value = reqwest::Client::new()
        .get(format!("http://{addr}/v1/agent-configs"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert!(body.as_array().unwrap().is_empty());
}

#[tokio::test]
async fn lists_valid_configs() {
    let (addr, tok, home) = spawn().await;

    let agents = home.path().join("agents");
    std::fs::create_dir_all(agents.join("alpha")).unwrap();
    std::fs::write(
        agents.join("alpha").join("houston.json"),
        r#"{"name":"alpha","version":"1"}"#,
    )
    .unwrap();
    std::fs::create_dir_all(agents.join("broken")).unwrap();
    std::fs::write(agents.join("broken").join("houston.json"), "{nope").unwrap();
    std::fs::create_dir_all(agents.join("bare")).unwrap();

    let body: serde_json::Value = reqwest::Client::new()
        .get(format!("http://{addr}/v1/agent-configs"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();

    let arr = body.as_array().unwrap();
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["config"]["name"], "alpha");
    assert!(arr[0]["path"].as_str().unwrap().ends_with("alpha"));
}

#[tokio::test]
async fn requires_auth() {
    let (addr, _tok, _home) = spawn().await;
    let res = reqwest::get(format!("http://{addr}/v1/agent-configs"))
        .await
        .unwrap();
    assert_eq!(res.status(), 401);
}
