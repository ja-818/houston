//! `/v1/attachments` REST routes.

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{
    body::Body,
    extract::{Path, State},
    routing::{get, post, put},
    Json, Router,
};
use futures_util::StreamExt;
use houston_engine_core::attachments::{
    self, AttachmentCommit, AttachmentManifest, CreateAttachmentUploadsRequest,
    MAX_ATTACHMENT_FILE_BYTES,
};
use houston_engine_core::CoreError;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::path::Path as FsPath;
use std::sync::Arc;
use tokio::io::AsyncWriteExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AttachmentUploadTarget {
    id: String,
    name: String,
    size: u64,
    upload_url: String,
    max_bytes: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CreateUploadsResponse {
    uploads: Vec<AttachmentUploadTarget>,
}

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/attachments/uploads", post(create_uploads))
        .route(
            "/attachments/uploads/:upload_id/content",
            put(upload_content),
        )
        .route(
            "/attachments/:scope_id",
            get(list_scope).delete(remove_scope),
        )
}

async fn create_uploads(
    State(st): State<Arc<ServerState>>,
    Json(req): Json<CreateAttachmentUploadsRequest>,
) -> Result<Json<CreateUploadsResponse>, ApiError> {
    let sessions = attachments::create_upload_sessions(st.engine.paths.home(), req)?;
    let uploads = sessions
        .iter()
        .map(|session| AttachmentUploadTarget {
            id: session.id.clone(),
            name: session.original_name.clone(),
            size: session.declared_size,
            upload_url: format!("/v1/attachments/uploads/{}/content", session.id),
            max_bytes: MAX_ATTACHMENT_FILE_BYTES,
        })
        .collect();
    st.attachment_uploads.insert_many(sessions)?;
    Ok(Json(CreateUploadsResponse { uploads }))
}

async fn upload_content(
    State(st): State<Arc<ServerState>>,
    Path(upload_id): Path<String>,
    body: Body,
) -> Result<Json<AttachmentCommit>, ApiError> {
    let session = st.attachment_uploads.get(&upload_id)?;
    let temp_path = attachments::upload_temp_path(st.engine.paths.home(), &upload_id)?;
    let streamed = stream_to_temp(body, &temp_path, MAX_ATTACHMENT_FILE_BYTES).await;
    let (received, sha256) = match streamed {
        Ok(result) => result,
        Err(err) => {
            remove_temp_if_exists(&temp_path).await?;
            return Err(ApiError(err));
        }
    };
    let committed = attachments::commit_upload(
        st.engine.paths.home(),
        &session,
        &temp_path,
        received,
        sha256,
    )?;
    st.attachment_uploads.remove(&session.id)?;
    Ok(Json(committed))
}

async fn list_scope(
    State(st): State<Arc<ServerState>>,
    Path(scope_id): Path<String>,
) -> Result<Json<Vec<AttachmentManifest>>, ApiError> {
    Ok(Json(attachments::list(st.engine.paths.home(), &scope_id)?))
}

async fn remove_scope(
    State(st): State<Arc<ServerState>>,
    Path(scope_id): Path<String>,
) -> Result<(), ApiError> {
    attachments::delete(st.engine.paths.home(), &scope_id)?;
    Ok(())
}

async fn stream_to_temp(
    body: Body,
    path: &FsPath,
    max_bytes: u64,
) -> Result<(u64, String), CoreError> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    let mut file = tokio::fs::File::create(path).await?;
    let mut stream = body.into_data_stream();
    let mut hasher = Sha256::new();
    let mut received = 0u64;
    while let Some(chunk) = stream.next().await {
        let bytes = chunk.map_err(|e| CoreError::BadRequest(format!("upload body: {e}")))?;
        received += bytes.len() as u64;
        if received > max_bytes {
            return Err(CoreError::BadRequest(format!(
                "attachment exceeds {max_bytes} bytes"
            )));
        }
        hasher.update(&bytes);
        file.write_all(&bytes).await?;
    }
    file.flush().await?;
    Ok((received, format!("{:x}", hasher.finalize())))
}

async fn remove_temp_if_exists(path: &FsPath) -> Result<(), CoreError> {
    match tokio::fs::remove_file(path).await {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.into()),
    }
}
