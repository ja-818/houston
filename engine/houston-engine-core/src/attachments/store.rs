use super::types::{AttachmentUploadSession, UPLOAD_SESSION_TTL_SECS};
use crate::error::{CoreError, CoreResult};
use chrono::Utc;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Clone, Default)]
pub struct AttachmentUploadStore {
    inner: Arc<Mutex<HashMap<String, AttachmentUploadSession>>>,
}

impl AttachmentUploadStore {
    pub fn insert_many(&self, sessions: Vec<AttachmentUploadSession>) -> CoreResult<()> {
        let mut map = self.lock()?;
        prune_expired(&mut map);
        for session in sessions {
            map.insert(session.id.clone(), session);
        }
        Ok(())
    }

    pub fn get(&self, id: &str) -> CoreResult<AttachmentUploadSession> {
        let mut map = self.lock()?;
        prune_expired(&mut map);
        map.get(id)
            .cloned()
            .ok_or_else(|| CoreError::NotFound(format!("attachment upload {id} not found")))
    }

    pub fn remove(&self, id: &str) -> CoreResult<()> {
        let mut map = self.lock()?;
        map.remove(id);
        Ok(())
    }

    fn lock(
        &self,
    ) -> CoreResult<std::sync::MutexGuard<'_, HashMap<String, AttachmentUploadSession>>> {
        self.inner
            .lock()
            .map_err(|_| CoreError::Internal("attachment upload store poisoned".into()))
    }
}

fn prune_expired(map: &mut HashMap<String, AttachmentUploadSession>) {
    let now = Utc::now();
    map.retain(|_, s| (now - s.created_at).num_seconds() <= UPLOAD_SESSION_TTL_SECS);
}
