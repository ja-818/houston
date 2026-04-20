//! Tauri command proxies for AI provider management.
//!
//! Delegates to `houston_engine_core::{provider, preferences}` — single
//! source of truth across invoke and HTTP. The default-provider
//! preference uses the generic key/value store under the shared key
//! `provider::DEFAULT_PROVIDER_KEY`.

use houston_engine_core::preferences;
use houston_engine_core::provider::{self, ProviderStatus, DEFAULT_PROVIDER_KEY};
use houston_tauri::state::AppState;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn check_provider_status(provider: String) -> Result<ProviderStatus, String> {
    let p = provider::parse(&provider).map_err(|e| e.to_string())?;
    provider::check_status(p).await.map_err(|e| e.to_string())
}

/// Returns empty string if never configured (matches the pre-Phase-2
/// Tauri contract the frontend already relies on).
#[tauri::command(rename_all = "snake_case")]
pub async fn get_default_provider(state: State<'_, AppState>) -> Result<String, String> {
    let v = preferences::get(&state.db, DEFAULT_PROVIDER_KEY)
        .await
        .map_err(|e| e.to_string())?;
    Ok(v.unwrap_or_default())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_default_provider(
    state: State<'_, AppState>,
    provider: String,
) -> Result<(), String> {
    let p = provider::parse(&provider).map_err(|e| e.to_string())?;
    preferences::set(&state.db, DEFAULT_PROVIDER_KEY, &p.to_string())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn launch_provider_login(provider: String) -> Result<(), String> {
    let p = provider::parse(&provider).map_err(|e| e.to_string())?;
    provider::launch_login(p).map_err(|e| e.to_string())
}
