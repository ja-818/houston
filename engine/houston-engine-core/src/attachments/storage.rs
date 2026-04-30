use super::types::{
    AttachmentManifest, AttachmentUploadInput, MAX_ATTACHMENT_BATCH_BYTES,
    MAX_ATTACHMENT_FILE_BYTES, MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST,
};
use crate::error::{CoreError, CoreResult};
use std::path::{Path, PathBuf};
use uuid::Uuid;

pub(super) fn attachments_root(home: &Path) -> PathBuf {
    home.join("cache").join("attachments")
}

pub(super) fn validate_scope(scope_id: &str) -> CoreResult<()> {
    if scope_id.is_empty() || scope_id.contains('/') || scope_id.contains("..") {
        return Err(CoreError::BadRequest(format!(
            "invalid scope_id: {scope_id}"
        )));
    }
    Ok(())
}

pub(super) fn validate_upload_id(upload_id: &str) -> CoreResult<()> {
    Uuid::parse_str(upload_id)
        .map(|_| ())
        .map_err(|_| CoreError::BadRequest(format!("invalid upload id: {upload_id}")))
}

pub(super) fn validate_batch(files: &[AttachmentUploadInput]) -> CoreResult<()> {
    if files.is_empty() {
        return Err(CoreError::BadRequest(
            "at least one attachment is required".into(),
        ));
    }
    if files.len() > MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST {
        return Err(CoreError::BadRequest(format!(
            "too many upload sessions requested: max {}",
            MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST
        )));
    }
    let total: u64 = files.iter().map(|f| f.size).sum();
    if total > MAX_ATTACHMENT_BATCH_BYTES {
        return Err(CoreError::BadRequest(format!(
            "attachment batch exceeds {} bytes",
            MAX_ATTACHMENT_BATCH_BYTES
        )));
    }
    for file in files {
        if file.size > MAX_ATTACHMENT_FILE_BYTES {
            return Err(CoreError::BadRequest(format!(
                "{} exceeds {} bytes",
                file.name, MAX_ATTACHMENT_FILE_BYTES
            )));
        }
    }
    Ok(())
}

pub(super) fn sanitize_filename(name: &str) -> String {
    let stripped: String = name
        .chars()
        .map(|c| {
            if c == '/' || c == '\\' || c == '\0' || c.is_control() {
                '_'
            } else {
                c
            }
        })
        .collect();
    let trimmed = stripped.trim_start_matches('.').trim();
    let safe = if trimmed.is_empty() {
        "attachment"
    } else {
        trimmed
    };
    safe.chars().take(180).collect()
}

pub(super) fn scope_manifest_dir(home: &Path, scope_id: &str) -> PathBuf {
    attachments_root(home)
        .join("scopes")
        .join(scope_id)
        .join("manifests")
}

pub(super) fn scope_file_path(
    home: &Path,
    scope_id: &str,
    id: &str,
    safe_name: &str,
) -> CoreResult<PathBuf> {
    let dir = attachments_root(home)
        .join("scopes")
        .join(scope_id)
        .join("files");
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join(format!("{id}-{safe_name}")))
}

pub(super) fn object_path(home: &Path, sha256: &str) -> CoreResult<PathBuf> {
    let dir = attachments_root(home).join("objects").join("sha256");
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join(sha256))
}

pub(super) fn write_manifest(
    home: &Path,
    scope_id: &str,
    id: &str,
    manifest: &AttachmentManifest,
) -> CoreResult<()> {
    let dir = scope_manifest_dir(home, scope_id);
    std::fs::create_dir_all(&dir)?;
    let path = dir.join(format!("{id}.json"));
    let tmp = dir.join(format!("{id}.json.tmp"));
    std::fs::write(&tmp, serde_json::to_vec_pretty(manifest)?)?;
    std::fs::rename(tmp, path)?;
    Ok(())
}

pub(super) fn link_or_copy(from: &Path, to: &Path) -> CoreResult<()> {
    remove_file_if_exists(to)?;
    match std::fs::hard_link(from, to) {
        Ok(()) => Ok(()),
        Err(_) => std::fs::copy(from, to).map(|_| ()).map_err(CoreError::from),
    }
}

pub(super) fn remove_file_if_exists(path: &Path) -> CoreResult<()> {
    match std::fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.into()),
    }
}

pub(super) fn remove_dir_if_exists(path: PathBuf) -> CoreResult<()> {
    match std::fs::remove_dir_all(path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.into()),
    }
}
