//! User-attached file storage for chat composer uploads.
//!
//! Uploads are binary HTTP bodies, not base64 JSON. The engine writes each
//! upload to a temp file, verifies size + hash, then commits it under
//! `<home>/cache/attachments/scopes/<scope_id>/files/`.

mod storage;
mod store;
#[cfg(test)]
mod tests;
mod types;

use crate::error::{CoreError, CoreResult};
use chrono::Utc;
use std::path::Path;
use uuid::Uuid;

pub use store::AttachmentUploadStore;
pub use types::*;

pub fn create_upload_sessions(
    home: &Path,
    req: CreateAttachmentUploadsRequest,
) -> CoreResult<Vec<AttachmentUploadSession>> {
    storage::validate_scope(&req.scope_id)?;
    storage::validate_batch(&req.files)?;
    let existing = scope_size(home, &req.scope_id)?;
    let incoming: u64 = req.files.iter().map(|f| f.size).sum();
    if existing + incoming > MAX_ATTACHMENT_SCOPE_BYTES {
        return Err(CoreError::BadRequest(format!(
            "attachment scope would exceed {} bytes",
            MAX_ATTACHMENT_SCOPE_BYTES
        )));
    }
    Ok(req
        .files
        .into_iter()
        .map(|file| AttachmentUploadSession {
            id: Uuid::new_v4().to_string(),
            scope_id: req.scope_id.clone(),
            safe_name: storage::sanitize_filename(&file.name),
            original_name: file.name,
            declared_size: file.size,
            mime: file.mime,
            created_at: Utc::now(),
        })
        .collect())
}

pub fn upload_temp_path(home: &Path, upload_id: &str) -> CoreResult<std::path::PathBuf> {
    storage::validate_upload_id(upload_id)?;
    let dir = storage::attachments_root(home).join("uploads");
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join(format!("{upload_id}.tmp")))
}

pub fn commit_upload(
    home: &Path,
    session: &AttachmentUploadSession,
    temp_path: &Path,
    actual_size: u64,
    sha256: String,
) -> CoreResult<AttachmentCommit> {
    if actual_size != session.declared_size {
        storage::remove_file_if_exists(temp_path)?;
        return Err(CoreError::BadRequest(format!(
            "attachment size mismatch: declared {}, received {}",
            session.declared_size, actual_size
        )));
    }
    let object_path = storage::object_path(home, &sha256)?;
    let object_created = !object_path.exists();
    if !object_created {
        storage::remove_file_if_exists(temp_path)?;
    } else {
        std::fs::rename(temp_path, &object_path)?;
    }
    let file_path =
        storage::scope_file_path(home, &session.scope_id, &session.id, &session.safe_name)?;
    if let Err(err) = storage::link_or_copy(&object_path, &file_path) {
        rollback_commit(&file_path, &object_path, object_created)?;
        return Err(err);
    }
    let manifest = AttachmentManifest {
        id: session.id.clone(),
        scope_id: session.scope_id.clone(),
        original_name: session.original_name.clone(),
        safe_name: session.safe_name.clone(),
        mime: session.mime.clone(),
        size: actual_size,
        sha256: sha256.clone(),
        path: file_path.to_string_lossy().to_string(),
        object_path: object_path.to_string_lossy().to_string(),
        created_at: session.created_at.to_rfc3339(),
    };
    if let Err(err) = storage::write_manifest(home, &session.scope_id, &session.id, &manifest) {
        rollback_commit(&file_path, &object_path, object_created)?;
        return Err(err);
    }
    tracing::debug!(
        "[attachments] committed {} under scope {}",
        session.id,
        session.scope_id
    );
    Ok(AttachmentCommit {
        id: session.id.clone(),
        path: manifest.path,
        size: actual_size,
        sha256,
    })
}

pub fn list(home: &Path, scope_id: &str) -> CoreResult<Vec<AttachmentManifest>> {
    storage::validate_scope(scope_id)?;
    let dir = storage::scope_manifest_dir(home, scope_id);
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut items = Vec::new();
    for entry in std::fs::read_dir(dir)? {
        let path = entry?.path();
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            items.push(serde_json::from_str(&std::fs::read_to_string(path)?)?);
        }
    }
    items.sort_by(|a: &AttachmentManifest, b| a.created_at.cmp(&b.created_at));
    Ok(items)
}

pub fn delete(home: &Path, scope_id: &str) -> CoreResult<()> {
    storage::validate_scope(scope_id)?;
    let manifests = list(home, scope_id)?;
    storage::remove_dir_if_exists(
        storage::attachments_root(home)
            .join("scopes")
            .join(scope_id),
    )?;
    storage::remove_dir_if_exists(storage::attachments_root(home).join(scope_id))?;
    for manifest in manifests {
        if !sha_referenced(home, &manifest.sha256)? {
            storage::remove_file_if_exists(&storage::object_path(home, &manifest.sha256)?)?;
        }
    }
    tracing::debug!("[attachments] deleted scope {scope_id}");
    Ok(())
}

fn scope_size(home: &Path, scope_id: &str) -> CoreResult<u64> {
    Ok(list(home, scope_id)?.iter().map(|m| m.size).sum())
}

fn rollback_commit(file_path: &Path, object_path: &Path, object_created: bool) -> CoreResult<()> {
    storage::remove_file_if_exists(file_path)?;
    if object_created {
        storage::remove_file_if_exists(object_path)?;
    }
    Ok(())
}

fn sha_referenced(home: &Path, sha256: &str) -> CoreResult<bool> {
    let scopes = storage::attachments_root(home).join("scopes");
    if !scopes.exists() {
        return Ok(false);
    }
    for scope in std::fs::read_dir(scopes)? {
        let manifests = scope?.path().join("manifests");
        if !manifests.exists() {
            continue;
        }
        for entry in std::fs::read_dir(manifests)? {
            let path = entry?.path();
            if path.extension().and_then(|s| s.to_str()) != Some("json") {
                continue;
            }
            let manifest: AttachmentManifest =
                serde_json::from_str(&std::fs::read_to_string(path)?)?;
            if manifest.sha256 == sha256 {
                return Ok(true);
            }
        }
    }
    Ok(false)
}
