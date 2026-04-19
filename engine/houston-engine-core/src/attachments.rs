//! User-attached file storage for chat composer — relocated from
//! `app/src-tauri/src/commands/attachments.rs`.
//!
//! Files attached in the chat composer are persisted under
//! `<home>/cache/attachments/<scope_id>/<filename>`, where `<home>` is the
//! engine's home directory (`~/.houston/` by default) and `<scope_id>` is an
//! opaque id chosen by the caller (e.g. `"activity-<id>"`, `"agent-<id>"`).
//!
//! Files persist across restarts so a user can attach something, walk away,
//! and Claude can still read the path the original prompt referenced via
//! `--resume`. The owning activity/agent must call `delete` on its scope
//! when it goes away.

use crate::error::{CoreError, CoreResult};
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentInput {
    pub name: String,
    /// Base64-encoded bytes (standard alphabet, no URL-safe).
    pub data_base64: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SaveAttachmentsRequest {
    pub scope_id: String,
    pub files: Vec<AttachmentInput>,
}

fn validate_scope(scope_id: &str) -> CoreResult<()> {
    if scope_id.is_empty() || scope_id.contains('/') || scope_id.contains("..") {
        return Err(CoreError::BadRequest(format!("invalid scope_id: {scope_id}")));
    }
    Ok(())
}

fn attachments_root(home: &Path) -> PathBuf {
    home.join("cache").join("attachments")
}

fn scope_dir(home: &Path, scope_id: &str) -> CoreResult<PathBuf> {
    validate_scope(scope_id)?;
    let dir = attachments_root(home).join(scope_id);
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Sanitize a user-provided filename so it cannot escape the scope dir.
/// Strips path separators, leading dots, and falls back to a generic name.
fn sanitize_filename(name: &str) -> String {
    let stripped: String = name
        .chars()
        .map(|c| if c == '/' || c == '\\' || c == '\0' { '_' } else { c })
        .collect();
    let trimmed = stripped.trim_start_matches('.').trim();
    if trimmed.is_empty() {
        "attachment".to_string()
    } else {
        trimmed.to_string()
    }
}

/// Persist attached files for a scope and return their absolute paths.
/// If a file with the same name exists, it is overwritten — the caller is
/// responsible for picking scope ids that don't collide.
pub fn save(home: &Path, req: SaveAttachmentsRequest) -> CoreResult<Vec<String>> {
    let dir = scope_dir(home, &req.scope_id)?;
    let engine = base64::engine::general_purpose::STANDARD;
    let mut paths = Vec::with_capacity(req.files.len());
    for file in req.files {
        let bytes = engine
            .decode(file.data_base64.as_bytes())
            .map_err(|e| CoreError::BadRequest(format!("base64 decode {}: {e}", file.name)))?;
        let safe = sanitize_filename(&file.name);
        let path = dir.join(&safe);
        std::fs::write(&path, &bytes)?;
        paths.push(path.to_string_lossy().to_string());
    }
    tracing::debug!(
        "[attachments] saved {} file(s) under scope {}",
        paths.len(),
        req.scope_id
    );
    Ok(paths)
}

/// Delete the entire attachments directory for a scope. Idempotent.
pub fn delete(home: &Path, scope_id: &str) -> CoreResult<()> {
    validate_scope(scope_id)?;
    let dir = attachments_root(home).join(scope_id);
    if dir.exists() {
        std::fs::remove_dir_all(&dir)?;
        tracing::debug!("[attachments] deleted scope {scope_id}");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::engine::general_purpose::STANDARD;
    use tempfile::TempDir;

    fn b64(bytes: &[u8]) -> String {
        STANDARD.encode(bytes)
    }

    #[test]
    fn save_writes_and_returns_paths() {
        let home = TempDir::new().unwrap();
        let paths = save(
            home.path(),
            SaveAttachmentsRequest {
                scope_id: "activity-1".into(),
                files: vec![
                    AttachmentInput {
                        name: "note.txt".into(),
                        data_base64: b64(b"hello"),
                    },
                    AttachmentInput {
                        name: "data.bin".into(),
                        data_base64: b64(&[0u8, 1, 2, 3]),
                    },
                ],
            },
        )
        .unwrap();
        assert_eq!(paths.len(), 2);
        let stored = home.path().join("cache/attachments/activity-1/note.txt");
        assert_eq!(std::fs::read(stored).unwrap(), b"hello");
    }

    #[test]
    fn save_sanitizes_filenames() {
        let home = TempDir::new().unwrap();
        let paths = save(
            home.path(),
            SaveAttachmentsRequest {
                scope_id: "agent-42".into(),
                files: vec![AttachmentInput {
                    name: "../../etc/passwd".into(),
                    data_base64: b64(b"evil"),
                }],
            },
        )
        .unwrap();
        // Path separators collapse into underscores — no escape.
        assert!(paths[0].contains("attachments/agent-42/"));
        assert!(!paths[0].contains("/etc/passwd"));
    }

    #[test]
    fn save_rejects_invalid_scope() {
        let home = TempDir::new().unwrap();
        let err = save(
            home.path(),
            SaveAttachmentsRequest {
                scope_id: "../evil".into(),
                files: vec![],
            },
        )
        .unwrap_err();
        assert!(matches!(err, CoreError::BadRequest(_)));
    }

    #[test]
    fn save_rejects_bad_base64() {
        let home = TempDir::new().unwrap();
        let err = save(
            home.path(),
            SaveAttachmentsRequest {
                scope_id: "s".into(),
                files: vec![AttachmentInput {
                    name: "x.txt".into(),
                    data_base64: "!!!not base64!!!".into(),
                }],
            },
        )
        .unwrap_err();
        assert!(matches!(err, CoreError::BadRequest(_)));
    }

    #[test]
    fn delete_is_idempotent() {
        let home = TempDir::new().unwrap();
        // Delete before save — must not error.
        delete(home.path(), "nope").unwrap();
        save(
            home.path(),
            SaveAttachmentsRequest {
                scope_id: "s".into(),
                files: vec![AttachmentInput {
                    name: "a.txt".into(),
                    data_base64: b64(b"a"),
                }],
            },
        )
        .unwrap();
        assert!(home.path().join("cache/attachments/s").exists());
        delete(home.path(), "s").unwrap();
        assert!(!home.path().join("cache/attachments/s").exists());
        // Second delete — still OK.
        delete(home.path(), "s").unwrap();
    }

    #[test]
    fn delete_rejects_invalid_scope() {
        let home = TempDir::new().unwrap();
        let err = delete(home.path(), "foo/bar").unwrap_err();
        assert!(matches!(err, CoreError::BadRequest(_)));
    }
}
