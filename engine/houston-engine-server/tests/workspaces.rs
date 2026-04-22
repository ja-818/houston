//! Integration tests for `/v1/workspaces` REST slice.

use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn spawn() -> (SocketAddr, String, tempfile::TempDir) {
    let token = "wstest".to_string();
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
    (addr, token, docs)
}

#[tokio::test]
async fn create_list_rename_delete_workspace() {
    let (addr, tok, _docs) = spawn().await;
    let c = reqwest::Client::new();

    // Empty list.
    let list: serde_json::Value = c
        .get(format!("http://{addr}/v1/workspaces"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(list.as_array().unwrap().len(), 0);

    // Create.
    let ws: serde_json::Value = c
        .post(format!("http://{addr}/v1/workspaces"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "name": "alpha", "provider": "anthropic" }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(ws["name"], "alpha");
    let id = ws["id"].as_str().unwrap().to_string();

    // Duplicate → 409.
    let dup = c
        .post(format!("http://{addr}/v1/workspaces"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "name": "alpha" }))
        .send()
        .await
        .unwrap();
    assert_eq!(dup.status(), 409);

    // Rename.
    let rename_res = c
        .post(format!("http://{addr}/v1/workspaces/{id}/rename"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "newName": "beta" }))
        .send()
        .await
        .unwrap();
    let status = rename_res.status();
    let text = rename_res.text().await.unwrap();
    assert!(status.is_success(), "rename failed {status}: {text}");
    let renamed: serde_json::Value = serde_json::from_str(&text).unwrap();
    assert_eq!(renamed["name"], "beta");

    // Delete.
    let del = c
        .delete(format!("http://{addr}/v1/workspaces/{id}"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(del.status().is_success());
}
