//! Integration tests for `/v1/attachments` REST slice.

use base64::{engine::general_purpose::STANDARD, Engine};
use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn spawn() -> (SocketAddr, String, tempfile::TempDir) {
    let token = "atest".to_string();
    let docs = tempfile::TempDir::new().unwrap();
    let home = tempfile::TempDir::new().unwrap();
    let cfg = ServerConfig {
        bind: "127.0.0.1:0".parse().unwrap(),
        token: token.clone(),
        home_dir: home.path().to_path_buf(),
        docs_dir: docs.path().to_path_buf(),
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
async fn save_then_delete_attachments() {
    let (addr, tok, home) = spawn().await;
    let c = reqwest::Client::new();

    let payload = serde_json::json!({
        "scopeId": "activity-1",
        "files": [
            { "name": "note.txt", "dataBase64": STANDARD.encode(b"hello") },
            { "name": "data.bin", "dataBase64": STANDARD.encode(&[0u8, 1, 2, 3]) },
        ],
    });
    let saved: serde_json::Value = c
        .post(format!("http://{addr}/v1/attachments"))
        .bearer_auth(&tok)
        .json(&payload)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    let arr = saved.as_array().unwrap();
    assert_eq!(arr.len(), 2);

    let note = home.path().join("cache/attachments/activity-1/note.txt");
    assert_eq!(std::fs::read(&note).unwrap(), b"hello");

    // Invalid scope → 400.
    let bad = c
        .post(format!("http://{addr}/v1/attachments"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "scopeId": "../escape",
            "files": [],
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(bad.status(), 400);

    // Delete the scope.
    let del = c
        .delete(format!("http://{addr}/v1/attachments/activity-1"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(del.status().is_success());
    assert!(!home.path().join("cache/attachments/activity-1").exists());

    // Delete again → idempotent.
    let del2 = c
        .delete(format!("http://{addr}/v1/attachments/activity-1"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(del2.status().is_success());
}
