//! Integration tests for `/v1/routines` + `/v1/routine-runs` REST slices.

use houston_engine_server::{build_router, ServerConfig, ServerState};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;

async fn spawn() -> (SocketAddr, String, tempfile::TempDir) {
    let token = "routinetest".to_string();
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
async fn crud_routine_lifecycle() {
    let (addr, tok, docs) = spawn().await;
    let agent = docs.path().join("ws").join("alpha");
    std::fs::create_dir_all(&agent).unwrap();
    let agent_path = agent.to_string_lossy().to_string();
    let c = reqwest::Client::new();

    // Empty list.
    let list: serde_json::Value = c
        .get(format!("http://{addr}/v1/routines"))
        .query(&[("agentPath", &agent_path)])
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(list.as_array().unwrap().len(), 0);

    // Create.
    let r: serde_json::Value = c
        .post(format!("http://{addr}/v1/routines"))
        .query(&[("agentPath", &agent_path)])
        .bearer_auth(&tok)
        .json(&serde_json::json!({
            "name": "Daily",
            "description": "",
            "prompt": "How are things?",
            "schedule": "0 9 * * *",
            "enabled": true,
            "suppress_when_silent": true,
        }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(r["name"], "Daily");
    let id = r["id"].as_str().unwrap().to_string();

    // Update (disable).
    let u: serde_json::Value = c
        .patch(format!("http://{addr}/v1/routines/{id}"))
        .query(&[("agentPath", &agent_path)])
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "enabled": false }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(u["enabled"], false);

    // Delete.
    let del = c
        .delete(format!("http://{addr}/v1/routines/{id}"))
        .query(&[("agentPath", &agent_path)])
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap();
    assert!(del.status().is_success());

    // Missing → 404 on update.
    let miss = c
        .patch(format!("http://{addr}/v1/routines/{id}"))
        .query(&[("agentPath", &agent_path)])
        .bearer_auth(&tok)
        .json(&serde_json::json!({}))
        .send()
        .await
        .unwrap();
    assert_eq!(miss.status(), 404);
}

#[tokio::test]
async fn routine_runs_create_update_filter() {
    let (addr, tok, docs) = spawn().await;
    let agent = docs.path().join("ws").join("alpha");
    std::fs::create_dir_all(&agent).unwrap();
    let agent_path = agent.to_string_lossy().to_string();
    let c = reqwest::Client::new();

    // Create two routines so we have two routine IDs.
    let mk_routine = |name: &str| {
        serde_json::json!({
            "name": name,
            "description": "",
            "prompt": "p",
            "schedule": "* * * * *",
            "enabled": true,
            "suppress_when_silent": true,
        })
    };
    let r_a: serde_json::Value = c
        .post(format!("http://{addr}/v1/routines"))
        .query(&[("agentPath", &agent_path)])
        .bearer_auth(&tok)
        .json(&mk_routine("A"))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    let r_b: serde_json::Value = c
        .post(format!("http://{addr}/v1/routines"))
        .query(&[("agentPath", &agent_path)])
        .bearer_auth(&tok)
        .json(&mk_routine("B"))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    let rid_a = r_a["id"].as_str().unwrap();
    let rid_b = r_b["id"].as_str().unwrap();

    // Two runs for A, one for B.
    for rid in [rid_a, rid_a, rid_b] {
        let _: serde_json::Value = c
            .post(format!("http://{addr}/v1/routines/{rid}/runs"))
            .query(&[("agentPath", &agent_path)])
            .bearer_auth(&tok)
            .send()
            .await
            .unwrap()
            .json()
            .await
            .unwrap();
    }

    // List all runs.
    let all: serde_json::Value = c
        .get(format!("http://{addr}/v1/routine-runs"))
        .query(&[("agentPath", &agent_path)])
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(all.as_array().unwrap().len(), 3);

    // Filter by routineId.
    let filtered: serde_json::Value = c
        .get(format!("http://{addr}/v1/routine-runs"))
        .query(&[("agentPath", &agent_path), ("routineId", &rid_a.to_string())])
        .bearer_auth(&tok)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(filtered.as_array().unwrap().len(), 2);

    // Mark first run silent.
    let run_id = all[0]["id"].as_str().unwrap().to_string();
    let updated: serde_json::Value = c
        .patch(format!("http://{addr}/v1/routine-runs/{run_id}"))
        .query(&[("agentPath", &agent_path)])
        .bearer_auth(&tok)
        .json(&serde_json::json!({ "status": "silent", "summary": "nothing new" }))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(updated["status"], "silent");
    assert_eq!(updated["summary"], "nothing new");
}

#[tokio::test]
async fn requires_auth() {
    let (addr, _tok, _docs) = spawn().await;
    let c = reqwest::Client::new();
    let res = c
        .get(format!("http://{addr}/v1/routines"))
        .query(&[("agentPath", "/tmp/whatever")])
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), 401);
}
