//! Keychain-backed storage for Supabase auth sessions + deep-link callback
//! handling for Google OAuth.
//!
//! The frontend Supabase client uses these Tauri commands as its storage
//! adapter (see `app/src/lib/supabase.ts`), so auth tokens never hit
//! localStorage on disk — they live in macOS Keychain / Windows Credential
//! Manager via the `keyring` crate.
//!
//! Deep-link flow:
//!   1. Frontend calls `supabase.auth.signInWithOAuth({ provider: "google",
//!      options: { redirectTo: "houston://auth-callback" } })`.
//!   2. User completes consent in their system browser.
//!   3. Supabase redirects to `houston://auth-callback?code=...` (PKCE).
//!   4. macOS hands the URL to the running app via tauri-plugin-deep-link.
//!   5. This module emits `auth://deep-link` with the URL to the frontend.
//!   6. Frontend calls `supabase.auth.exchangeCodeForSession(code)` — the
//!      PKCE verifier was stashed in Keychain during step 1 and is read
//!      back out of the same storage adapter to complete the exchange.

use keyring::Entry;
use tauri::{AppHandle, Emitter};

const SERVICE: &str = "com.houston.app.auth";

fn entry(key: &str) -> Result<Entry, String> {
    Entry::new(SERVICE, key).map_err(|e| format!("keyring entry({key}): {e}"))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn auth_get_item(key: String) -> Result<Option<String>, String> {
    let e = entry(&key)?;
    match e.get_password() {
        Ok(v) => Ok(Some(v)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(format!("keyring get({key}): {err}")),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn auth_set_item(key: String, value: String) -> Result<(), String> {
    let e = entry(&key)?;
    e.set_password(&value)
        .map_err(|err| format!("keyring set({key}): {err}"))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn auth_remove_item(key: String) -> Result<(), String> {
    let e = entry(&key)?;
    match e.delete_credential() {
        Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(format!("keyring delete({key}): {err}")),
    }
}

/// Forward a deep-link URL to the frontend. Called by the tauri-plugin-deep-link
/// handler installed in `lib.rs`. The frontend extracts the `code` param and
/// runs `supabase.auth.exchangeCodeForSession(code)`.
pub fn emit_deep_link(handle: &AppHandle, url: &str) {
    if let Err(e) = handle.emit("auth://deep-link", url) {
        tracing::error!("[auth] failed to emit deep-link event: {e}");
    }
}

/// Best-effort read of the persisted Supabase session from Keychain, returning
/// the user_id if present. Called at engine spawn time so the subprocess can
/// stamp `HOUSTON_APP_USER_ID` on its own operations. Failures (no entry,
/// corrupt JSON, locked Keychain) all resolve to `None` silently — the engine
/// runs fine without an identity.
pub fn persisted_user_id() -> Option<String> {
    if option_env!("HOUSTON_AUTH_STORAGE_MODE") != Some("keychain") {
        return None;
    }

    // Storage key must match `storageKey` in app/src/lib/supabase.ts.
    let entry = Entry::new(SERVICE, "houston-auth").ok()?;
    let raw = entry.get_password().ok()?;
    let parsed: serde_json::Value = serde_json::from_str(&raw).ok()?;
    parsed
        .get("user")
        .and_then(|u| u.get("id"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Round-trip set / get / remove against the real Keychain.
    ///
    /// Ignored by default — on first run macOS prompts the developer to
    /// allow Keychain access, and CI has no Keychain at all. Run locally
    /// with `cargo test -p houston-app auth:: -- --ignored`.
    #[tokio::test]
    #[ignore]
    async fn keychain_round_trip() {
        let key = "__houston_test__";
        let _ = auth_remove_item(key.into()).await;

        auth_set_item(key.into(), "hello".into()).await.unwrap();
        let got = auth_get_item(key.into()).await.unwrap();
        assert_eq!(got.as_deref(), Some("hello"));

        auth_remove_item(key.into()).await.unwrap();
        let after = auth_get_item(key.into()).await.unwrap();
        assert!(after.is_none());
    }

    #[test]
    fn local_auth_storage_does_not_read_persisted_keychain_user() {
        if option_env!("HOUSTON_AUTH_STORAGE_MODE") == Some("browser") {
            assert!(persisted_user_id().is_none());
        }
    }
}
