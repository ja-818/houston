//! Integration tests for `/v1/attachments` REST slice.

use houston_engine_core::attachments::{
    MAX_ATTACHMENT_FILE_BYTES, MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST,
};
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
    std::mem::forget(docs);
    (addr, token, home)
}

#[tokio::test]
async fn uploads_large_binary_files_then_lists_and_deletes_scope() {
    let (addr, tok, home) = spawn().await;
    let c = reqwest::Client::new();
    let big = vec![7u8; 3 * 1024 * 1024];
    let small = b"hello".to_vec();

    let created: serde_json::Value = c
        .post(format!("http://{addr}/v1/attachments/uploads"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "scopeId": "activity-1",
            "files": [
                { "name": "scan.pdf", "size": big.len(), "mime": "application/pdf" },
                { "name": "photo.png", "size": small.len(), "mime": "image/png" }
            ],
        }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    let uploads = created["uploads"].as_array().unwrap();
    assert_eq!(uploads.len(), 2);

    let first = put_upload(&c, addr, &tok, &uploads[0], big).await;
    let second = put_upload(&c, addr, &tok, &uploads[1], small).await;
    assert_eq!(
        std::fs::metadata(first["path"].as_str().unwrap())
            .unwrap()
            .len(),
        3 * 1024 * 1024
    );
    assert_eq!(
        std::fs::read(second["path"].as_str().unwrap()).unwrap(),
        b"hello"
    );

    let listed: Vec<serde_json::Value> = c
        .get(format!("http://{addr}/v1/attachments/activity-1"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(listed.len(), 2);
    assert_eq!(listed[0]["originalName"], "scan.pdf");

    let del = c
        .delete(format!("http://{addr}/v1/attachments/activity-1"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(del.status().is_success());
    assert!(!home
        .path()
        .join("cache/attachments/scopes/activity-1")
        .exists());
}

#[tokio::test]
async fn uploads_large_user_selection_across_create_request_chunks() {
    let (addr, tok, _home) = spawn().await;
    let c = reqwest::Client::new();
    let files: Vec<_> = (0..72)
        .map(|i| (format!("statement-{i}.pdf"), format!("statement body {i}")))
        .collect();

    for chunk in files.chunks(MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST) {
        let create_files: Vec<_> = chunk
            .iter()
            .map(|(name, body)| {
                serde_json::json!({
                    "name": name,
                    "size": body.len(),
                    "mime": "application/pdf"
                })
            })
            .collect();
        let created: serde_json::Value = c
            .post(format!("http://{addr}/v1/attachments/uploads"))
            .bearer_auth(&tok)
            .json(&serde_json::json!({
                "scopeId": "activity-72",
                "files": create_files,
            }))
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
        let uploads = created["uploads"].as_array().unwrap();
        assert_eq!(uploads.len(), chunk.len());

        for (upload, (_name, body)) in uploads.iter().zip(chunk) {
            let result = put_upload(&c, addr, &tok, upload, body.as_bytes().to_vec()).await;
            assert!(std::path::Path::new(result["path"].as_str().unwrap()).exists());
        }
    }

    let listed: Vec<serde_json::Value> = c
        .get(format!("http://{addr}/v1/attachments/activity-72"))
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(listed.len(), 72);
}

#[tokio::test]
async fn create_upload_rejects_invalid_scope_and_oversized_file() {
    let (addr, tok, _home) = spawn().await;
    let c = reqwest::Client::new();

    let bad_scope = c
        .post(format!("http://{addr}/v1/attachments/uploads"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "scopeId": "../escape",
            "files": [{ "name": "x.txt", "size": 1 }]
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(bad_scope.status(), 400);

    let too_large = c
        .post(format!("http://{addr}/v1/attachments/uploads"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "scopeId": "s",
            "files": [{ "name": "x.bin", "size": MAX_ATTACHMENT_FILE_BYTES + 1 }]
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(too_large.status(), 400);
}

#[tokio::test]
async fn upload_rejects_declared_size_mismatch() {
    let (addr, tok, _home) = spawn().await;
    let c = reqwest::Client::new();

    let created: serde_json::Value = c
        .post(format!("http://{addr}/v1/attachments/uploads"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "scopeId": "activity-2",
            "files": [{ "name": "note.txt", "size": 4 }]
        }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    let upload = &created["uploads"].as_array().unwrap()[0];
    let res = c
        .put(format!(
            "http://{addr}{}",
            upload["uploadUrl"].as_str().unwrap()
        ))
        .bearer_auth(&tok)
        .body("hello".as_bytes().to_vec())
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 400);
}

async fn put_upload(
    c: &reqwest::Client,
    addr: SocketAddr,
    tok: &str,
    upload: &serde_json::Value,
    bytes: Vec<u8>,
) -> serde_json::Value {
    c.put(format!(
        "http://{addr}{}",
        upload["uploadUrl"].as_str().unwrap()
    ))
    .bearer_auth(tok)
    .body(bytes)
    .send()
    .await
    .unwrap()
    .json()
    .await
    .unwrap()
}
