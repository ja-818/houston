//! Integration tests for `/v1/store` + `/v1/agents:*` REST slices.
//!
//! Network-dependent routes (catalog/search/install from real GitHub) are
//! covered by unit tests on `parse_github_ref` and live probes. These tests
//! exercise the purely local routes: uninstall + check-updates.

use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn spawn() -> (SocketAddr, String, tempfile::TempDir, tempfile::TempDir) {
    let token = "storetest".to_string();
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
    (addr, token, docs, home)
}

#[tokio::test]
async fn check_updates_empty_returns_empty_list() {
    let (addr, tok, _docs, _home) = spawn().await;
    let c = reqwest::Client::new();

    let res = c
        .post(format!("http://{addr}/v1/agents/check-updates"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(res.status().is_success(), "{:?}", res.status());
    let list: Vec<String> = res.json().await.unwrap();
    assert!(list.is_empty());
}

#[tokio::test]
async fn uninstall_removes_agent_dir() {
    let (addr, tok, _docs, home) = spawn().await;
    let agents_dir = home.path().join("agents");
    let agent = agents_dir.join("demo-agent");
    std::fs::create_dir_all(&agent).unwrap();
    std::fs::write(agent.join("houston.json"), "{}").unwrap();
    assert!(agent.exists());

    let c = reqwest::Client::new();
    let res = c
        .delete(format!("http://{addr}/v1/store/installs/demo-agent"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(res.status().is_success());
    assert!(!agent.exists());
}

#[tokio::test]
async fn uninstall_missing_agent_is_ok() {
    let (addr, tok, _docs, _home) = spawn().await;
    let c = reqwest::Client::new();

    let res = c
        .delete(format!("http://{addr}/v1/store/installs/ghost"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(res.status().is_success(), "{:?}", res.status());
}

#[tokio::test]
async fn install_from_github_rejects_garbage() {
    let (addr, tok, _docs, _home) = spawn().await;
    let c = reqwest::Client::new();

    let res = c
        .post(format!("http://{addr}/v1/agents/install-from-github"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "githubUrl": "not-a-repo" }))
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 400);
}

#[tokio::test]
async fn requires_auth() {
    let (addr, _tok, _docs, _home) = spawn().await;
    let c = reqwest::Client::new();
    let res = c
        .post(format!("http://{addr}/v1/agents/check-updates"))
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 401);
}
