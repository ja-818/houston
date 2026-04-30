use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

pub const MAX_ATTACHMENT_FILE_BYTES: u64 = 100 * 1024 * 1024;
pub const MAX_ATTACHMENT_BATCH_BYTES: u64 = 250 * 1024 * 1024;
pub const MAX_ATTACHMENT_SCOPE_BYTES: u64 = 500 * 1024 * 1024;
pub const MAX_UPLOAD_SESSIONS_PER_CREATE_REQUEST: usize = 25;
pub const UPLOAD_SESSION_TTL_SECS: i64 = 60 * 60;

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentUploadInput {
    pub name: String,
    pub size: u64,
    #[serde(default)]
    pub mime: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateAttachmentUploadsRequest {
    pub scope_id: String,
    pub files: Vec<AttachmentUploadInput>,
}

#[derive(Clone, Debug)]
pub struct AttachmentUploadSession {
    pub id: String,
    pub scope_id: String,
    pub original_name: String,
    pub safe_name: String,
    pub declared_size: u64,
    pub mime: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentManifest {
    pub id: String,
    pub scope_id: String,
    pub original_name: String,
    pub safe_name: String,
    pub mime: Option<String>,
    pub size: u64,
    pub sha256: String,
    pub path: String,
    pub object_path: String,
    pub created_at: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentCommit {
    pub id: String,
    pub path: String,
    pub size: u64,
    pub sha256: String,
}
