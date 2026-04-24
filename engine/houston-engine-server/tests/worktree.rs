//! Integration tests for `/v1/worktrees` + `/v1/shell` REST slice.

use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::process::Command;

async fn spawn() -> (SocketAddr, String, tempfile::TempDir) {
    let token = "wttest".to_string();
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
    // Keep `home` alive — return `docs` so the caller can use a scratch dir.
    std::mem::forget(home);
    (addr, token, docs)
}

async fn git(dir: &Path, args: &[&str]) {
    let out = Command::new("git")
        .args(args)
        .current_dir(dir)
        .output()
        .await
        .unwrap();
    assert!(
        out.status.success(),
        "git {args:?}: {}",
        String::from_utf8_lossy(&out.stderr)
    );
}

async fn init_repo(parent: &Path) -> PathBuf {
    let repo = parent.join("repo");
    std::fs::create_dir_all(&repo).unwrap();
    git(&repo, &["init", "-b", "main"]).await;
    git(&repo, &["config", "user.email", "test@test.test"]).await;
    git(&repo, &["config", "user.name", "Test"]).await;
    git(&repo, &["config", "commit.gpgsign", "false"]).await;
    std::fs::write(repo.join("README.md"), "hi").unwrap();
    git(&repo, &["add", "."]).await;
    git(&repo, &["commit", "-m", "init"]).await;
    repo
}

#[tokio::test]
async fn worktree_crud_over_http() {
    let (addr, tok, scratch) = spawn().await;
    let repo = init_repo(scratch.path()).await;
    let repo_str = repo.to_string_lossy().to_string();
    let c = reqwest::Client::new();

    // Create.
    let created: serde_json::Value = c
        .post(format!("http://{addr}/v1/worktrees"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "repoPath": repo_str,
            "name": "feature-x",
        }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(created["branch"], "houston/feature-x");
    let wt_path = created["path"].as_str().unwrap().to_string();
    assert!(PathBuf::from(&wt_path).exists());

    // List.
    let list: serde_json::Value = c
        .post(format!("http://{addr}/v1/worktrees/list"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "repoPath": repo_str }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    let arr = list.as_array().unwrap();
    assert_eq!(arr.len(), 2);

    // Duplicate → 409.
    let dup = c
        .post(format!("http://{addr}/v1/worktrees"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "repoPath": repo_str, "name": "feature-x" }))
        .send()
        .await
        .unwrap();
    assert_eq!(dup.status(), 409);

    // Remove.
    let rm = c
        .post(format!("http://{addr}/v1/worktrees/remove"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "repoPath": repo_str,
            "worktreePath": wt_path,
        }))
        .send()
        .await
        .unwrap();
    assert!(rm.status().is_success());
    assert!(!PathBuf::from(&wt_path).exists());
}

#[tokio::test]
async fn shell_runs_and_returns_stdout() {
    let (addr, tok, scratch) = spawn().await;
    let c = reqwest::Client::new();

    let out: serde_json::Value = c
        .post(format!("http://{addr}/v1/shell"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "path": scratch.path().to_string_lossy(),
            "command": "echo hello",
        }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(out.as_str().unwrap().trim(), "hello");

    // Missing dir → 404.
    let nf = c
        .post(format!("http://{addr}/v1/shell"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "path": "/definitely/not/real/zz",
            "command": "echo x",
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(nf.status(), 404);

    // Non-zero exit → 400.
    let bad = c
        .post(format!("http://{addr}/v1/shell"))
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "path": scratch.path().to_string_lossy(),
            "command": "false",
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(bad.status(), 400);
}
