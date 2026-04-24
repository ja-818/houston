//! Persist `{tunnelId, tunnelToken}` on disk so the same engine keeps the
//! same public-facing URL across restarts.
//!
//! Stored in `<home_dir>/tunnel.json` — separate from `engine.json` (which
//! is created by the desktop supervisor and doesn't belong to the engine).

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TunnelIdentity {
    pub tunnel_id: String,
    pub tunnel_token: String,
    pub public_host: String,
}

fn path(home_dir: &Path) -> PathBuf {
    home_dir.join("tunnel.json")
}

pub fn load(home_dir: &Path) -> Option<TunnelIdentity> {
    let bytes = std::fs::read(path(home_dir)).ok()?;
    serde_json::from_slice(&bytes).ok()
}

pub fn save(home_dir: &Path, id: &TunnelIdentity) -> anyhow::Result<()> {
    std::fs::create_dir_all(home_dir)?;
    let tmp = home_dir.join("tunnel.json.tmp");
    std::fs::write(&tmp, serde_json::to_vec_pretty(id)?)?;
    std::fs::rename(&tmp, path(home_dir))?;
    Ok(())
}

/// Remove the cached identity so the next call to [`ensure`] hits
/// `/allocate` and mints a fresh one. Safe to call when no file exists.
pub fn invalidate(home_dir: &Path) {
    let _ = std::fs::remove_file(path(home_dir));
}

/// First-boot: POST {relay_base}/allocate → allocate tunnel. Cached afterwards.
pub async fn ensure(
    home_dir: &Path,
    relay_base: &str,
) -> anyhow::Result<TunnelIdentity> {
    if let Some(id) = load(home_dir) {
        return Ok(id);
    }
    let url = format!("{}/allocate", relay_base.trim_end_matches('/'));
    let resp = reqwest::Client::new()
        .post(&url)
        .send()
        .await?
        .error_for_status()?;
    let id: TunnelIdentity = resp.json().await?;
    save(home_dir, &id)?;
    Ok(id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip() {
        let tmp = tempfile::tempdir().unwrap();
        let id = TunnelIdentity {
            tunnel_id: "abc".into(),
            tunnel_token: "tok".into(),
            public_host: "tunnel.test".into(),
        };
        save(tmp.path(), &id).unwrap();
        let loaded = load(tmp.path()).unwrap();
        assert_eq!(loaded.tunnel_id, "abc");
        assert_eq!(loaded.public_host, "tunnel.test");
    }

    #[test]
    fn load_missing_returns_none() {
        let tmp = tempfile::tempdir().unwrap();
        assert!(load(tmp.path()).is_none());
    }
}
