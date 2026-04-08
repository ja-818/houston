//! Composio OAuth PKCE flow for desktop apps.
//!
//! Two-phase flow:
//! 1. `begin_oauth_flow()` — sets up PKCE, opens browser, spawns background
//!    listener on a fixed port. Returns the auth URL immediately.
//! 2. The background listener waits for the callback and exchanges the code.
//!    Alternatively, `complete_oauth_from_url()` accepts a manually pasted URL.
//!
//! Both paths converge on the same code exchange + keychain update logic.

use base64::Engine;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::Mutex;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

/// Fixed port for the OAuth callback listener.
const CALLBACK_PORT: u16 = 19823;

// -- Shared pending state --

struct PendingOAuth {
    auth_url: String,
    verifier: String,
    client_id: String,
    redirect_uri: String,
    token_endpoint: String,
}

static PENDING: Mutex<Option<PendingOAuth>> = Mutex::new(None);

// -- Public result type --

#[derive(Debug, Clone, Serialize)]
pub struct OAuthStarted {
    pub auth_url: String,
}

// -- Public API --

/// Set up the OAuth flow and open the browser. Returns the auth URL.
/// Spawns a background listener that will complete the flow when the
/// browser redirects back. Emits `"composio-auth-result"` on the app handle.
pub async fn begin_oauth_flow(
    app_handle: tauri::AppHandle,
) -> Result<OAuthStarted, String> {
    let config = read_oauth_config()?;
    let metadata = fetch_metadata(&config.auth_server_url, &config.resource_metadata_url).await?;

    let redirect_uri = format!("http://127.0.0.1:{CALLBACK_PORT}/callback");

    let reg_endpoint = metadata
        .registration_endpoint
        .as_deref()
        .ok_or("Server does not support dynamic client registration")?;
    let registration = register_client(reg_endpoint, &redirect_uri).await?;
    tracing::debug!("[composio:auth] Registered client: {}", registration.client_id);

    let verifier = generate_verifier();
    let challenge = compute_challenge(&verifier);

    let auth_url = build_auth_url(
        &metadata.authorization_endpoint,
        &registration.client_id,
        &redirect_uri,
        &config.scope,
        &challenge,
    );

    // Store exchange params for background listener and manual fallback
    {
        let mut pending = PENDING.lock().unwrap();
        *pending = Some(PendingOAuth {
            auth_url: auth_url.clone(),
            verifier,
            client_id: registration.client_id,
            redirect_uri,
            token_endpoint: metadata.token_endpoint,
        });
    }

    // Open browser
    std::process::Command::new("open")
        .arg(&auth_url)
        .spawn()
        .map_err(|e| format!("Failed to open browser: {e}"))?;

    // Spawn background listener
    tokio::spawn(async move {
        let result = run_callback_listener().await;
        emit_auth_result(&app_handle, result);
    });

    Ok(OAuthStarted { auth_url })
}

/// Re-open the browser with the pending auth URL.
pub fn reopen_oauth_browser() -> Result<(), String> {
    let pending = PENDING.lock().unwrap();
    let p = pending.as_ref().ok_or("No pending OAuth flow")?;
    std::process::Command::new("open")
        .arg(&p.auth_url)
        .spawn()
        .map_err(|e| format!("Failed to open browser: {e}"))?;
    Ok(())
}

/// Complete the OAuth flow from a manually pasted callback URL.
/// Extracts the authorization code and exchanges it for tokens.
pub async fn complete_oauth_from_url(callback_url: &str) -> Result<(), String> {
    let code = extract_param(callback_url, "code")
        .ok_or("No authorization code found in the pasted URL")?;

    if let Some(err) = extract_param(callback_url, "error") {
        let desc = extract_param(callback_url, "error_description").unwrap_or(err);
        return Err(format!("OAuth error: {desc}"));
    }

    exchange_and_store(&code).await
}

/// Silently refresh the access token using a stored refresh token.
pub async fn refresh_access_token() -> Result<String, String> {
    let config = read_oauth_config()?;
    let refresh_token = read_refresh_token()
        .ok_or("No refresh token stored — full re-auth required")?;

    let metadata = fetch_metadata(&config.auth_server_url, &config.resource_metadata_url).await?;

    let client = reqwest::Client::new();
    let resp = client
        .post(&metadata.token_endpoint)
        .form(&[
            ("grant_type", "refresh_token"),
            ("refresh_token", &refresh_token),
            ("client_id", &config.client_id),
        ])
        .send()
        .await
        .map_err(|e| format!("Refresh request failed: {e}"))?;

    let status = resp.status();
    let body = resp.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("Refresh returned {status}: {body}"));
    }

    let token: TokenResponse =
        serde_json::from_str(&body).map_err(|e| format!("Invalid refresh response: {e}"))?;

    update_keychain_token(
        &token.access_token,
        token.expires_in,
        token.refresh_token.as_deref(),
    )?;

    tracing::info!("[composio] Token refreshed silently");
    Ok(token.access_token)
}

// -- Background listener --

async fn run_callback_listener() -> Result<(), String> {
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{CALLBACK_PORT}"))
        .await
        .map_err(|e| format!("Failed to bind port {CALLBACK_PORT}: {e}"))?;

    let (mut stream, _) = tokio::time::timeout(
        std::time::Duration::from_secs(300),
        listener.accept(),
    )
    .await
    .map_err(|_| "OAuth timed out — no response within 5 minutes".to_string())?
    .map_err(|e| format!("Failed to accept callback: {e}"))?;

    let mut buf = vec![0u8; 8192];
    let n = stream.read(&mut buf).await.map_err(|e| e.to_string())?;
    let request = String::from_utf8_lossy(&buf[..n]);
    let first_line = request.lines().next().unwrap_or("");
    let path = first_line.split_whitespace().nth(1).unwrap_or("");

    if let Some(err) = extract_param(path, "error") {
        let desc = extract_param(path, "error_description").unwrap_or_else(|| err.clone());
        send_response(&mut stream, "Authorization failed", &desc).await;
        return Err(format!("OAuth error: {desc}"));
    }

    let code = extract_param(path, "code")
        .ok_or("No authorization code in callback")?;

    send_response(
        &mut stream,
        "Connected to Composio!",
        "You can close this tab and return to Houston.",
    )
    .await;

    exchange_and_store(&code).await
}

fn emit_auth_result(app: &tauri::AppHandle, result: Result<(), String>) {
    use tauri::Emitter;
    let payload = match &result {
        Ok(()) => serde_json::json!({ "success": true }),
        Err(e) => serde_json::json!({ "success": false, "error": e }),
    };
    let _ = app.emit("composio-auth-result", payload);
}

// -- Shared exchange logic --

async fn exchange_and_store(code: &str) -> Result<(), String> {
    let (verifier, client_id, redirect_uri, token_endpoint) = {
        let pending = PENDING.lock().unwrap();
        let p = pending.as_ref().ok_or("No pending OAuth flow to complete")?;
        (
            p.verifier.clone(),
            p.client_id.clone(),
            p.redirect_uri.clone(),
            p.token_endpoint.clone(),
        )
    };

    let token = exchange_code(&token_endpoint, code, &client_id, &redirect_uri, &verifier).await?;
    update_keychain_token(&token.access_token, token.expires_in, token.refresh_token.as_deref())?;

    // Clear pending state
    { *PENDING.lock().unwrap() = None; }

    tracing::info!("[composio] OAuth flow completed successfully");
    Ok(())
}

// -- Internal types --

struct OAuthConfig {
    client_id: String,
    auth_server_url: String,
    resource_metadata_url: String,
    scope: String,
}

#[derive(Deserialize)]
struct OAuthMetadata {
    authorization_endpoint: String,
    token_endpoint: String,
    registration_endpoint: Option<String>,
}

#[derive(Deserialize)]
struct ClientRegistration {
    client_id: String,
    #[allow(dead_code)]
    client_secret: Option<String>,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    expires_in: Option<u64>,
    refresh_token: Option<String>,
}

// -- Read config from keychain --

fn read_oauth_config() -> Result<OAuthConfig, String> {
    let username = get_username()?;
    let data = read_keychain(&username)?;
    let mcp_oauth = data
        .get("mcpOAuth")
        .and_then(|v| v.as_object())
        .ok_or("No mcpOAuth in keychain")?;

    for (key, info) in mcp_oauth {
        if key.starts_with("composio") {
            let client_id = info
                .get("clientId")
                .and_then(|v| v.as_str())
                .ok_or("Missing clientId")?
                .to_string();
            let discovery = info.get("discoveryState").ok_or("Missing discoveryState")?;
            let auth_server_url = discovery
                .get("authorizationServerUrl")
                .and_then(|v| v.as_str())
                .ok_or("Missing authorizationServerUrl")?
                .to_string();
            let resource_metadata_url = discovery
                .get("resourceMetadataUrl")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let scope = info
                .get("scope")
                .and_then(|v| v.as_str())
                .unwrap_or("openid profile email offline_access")
                .to_string();
            return Ok(OAuthConfig {
                client_id,
                auth_server_url,
                resource_metadata_url,
                scope,
            });
        }
    }
    Err("No composio entry in keychain".to_string())
}

fn read_refresh_token() -> Option<String> {
    let username = get_username().ok()?;
    let data = read_keychain(&username).ok()?;
    let mcp_oauth = data.get("mcpOAuth")?.as_object()?;
    for (key, info) in mcp_oauth {
        if key.starts_with("composio") {
            return info
                .get("refreshToken")
                .and_then(|t| t.as_str())
                .filter(|s| !s.is_empty())
                .map(String::from);
        }
    }
    None
}

// -- Fetch OAuth metadata --

async fn fetch_metadata(
    auth_server_url: &str,
    resource_metadata_url: &str,
) -> Result<OAuthMetadata, String> {
    let client = reqwest::Client::new();

    let candidates = [
        resource_metadata_url.to_string(),
        format!("{}/.well-known/oauth-authorization-server", root_url(auth_server_url)),
        format!("{}/.well-known/oauth-authorization-server", auth_server_url),
        format!("{}/.well-known/openid-configuration", root_url(auth_server_url)),
    ];

    for url in &candidates {
        tracing::debug!("[composio:auth] Trying: {url}");
        let resp = match client.get(url).send().await {
            Ok(r) => r,
            Err(_) => continue,
        };
        if !resp.status().is_success() {
            tracing::debug!("[composio:auth]   → {}", resp.status());
            continue;
        }
        let body = resp.text().await.unwrap_or_default();
        tracing::debug!("[composio:auth]   → 200, body: {}", &body[..body.len().min(300)]);

        if let Ok(meta) = serde_json::from_str::<OAuthMetadata>(&body) {
            return Ok(meta);
        }
        if let Ok(res) = serde_json::from_str::<serde_json::Value>(&body) {
            if let Some(servers) = res.get("authorization_servers").and_then(|s| s.as_array()) {
                for server_url in servers.iter().filter_map(|s| s.as_str()) {
                    tracing::debug!("[composio:auth] Found AS: {server_url}");
                    let as_url = format!("{}/.well-known/oauth-authorization-server", server_url);
                    if let Ok(as_resp) = client.get(&as_url).send().await {
                        if as_resp.status().is_success() {
                            if let Ok(meta) = as_resp.json::<OAuthMetadata>().await {
                                return Ok(meta);
                            }
                        }
                    }
                    let oidc_url = format!("{}/.well-known/openid-configuration", server_url);
                    if let Ok(oidc_resp) = client.get(&oidc_url).send().await {
                        if oidc_resp.status().is_success() {
                            if let Ok(meta) = oidc_resp.json::<OAuthMetadata>().await {
                                return Ok(meta);
                            }
                        }
                    }
                }
            }
        }
    }

    Err("Could not find OAuth metadata at any known endpoint".to_string())
}

fn root_url(url: &str) -> String {
    if let Some(idx) = url.find("://") {
        let after_scheme = &url[idx + 3..];
        if let Some(slash) = after_scheme.find('/') {
            return url[..idx + 3 + slash].to_string();
        }
    }
    url.to_string()
}

// -- Dynamic client registration (RFC 7591) --

async fn register_client(
    registration_endpoint: &str,
    redirect_uri: &str,
) -> Result<ClientRegistration, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "client_name": "Houston Desktop App",
        "redirect_uris": [redirect_uri],
        "grant_types": ["authorization_code"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none",
    });

    let resp = client
        .post(registration_endpoint)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Client registration failed: {e}"))?;

    let status = resp.status();
    let text = resp.text().await.unwrap_or_default();

    if !status.is_success() {
        return Err(format!("Client registration returned {status}: {text}"));
    }

    serde_json::from_str(&text)
        .map_err(|e| format!("Invalid registration response: {e}"))
}

// -- PKCE --

fn generate_verifier() -> String {
    let bytes1 = uuid::Uuid::new_v4().into_bytes();
    let bytes2 = uuid::Uuid::new_v4().into_bytes();
    let bytes3 = uuid::Uuid::new_v4().into_bytes();
    let mut combined = Vec::with_capacity(48);
    combined.extend_from_slice(&bytes1);
    combined.extend_from_slice(&bytes2);
    combined.extend_from_slice(&bytes3);
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&combined)
}

fn compute_challenge(verifier: &str) -> String {
    let hash = Sha256::digest(verifier.as_bytes());
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(hash)
}

// -- Build authorization URL --

fn build_auth_url(
    endpoint: &str,
    client_id: &str,
    redirect_uri: &str,
    scope: &str,
    challenge: &str,
) -> String {
    format!(
        "{}?response_type=code&client_id={}&redirect_uri={}&scope={}&code_challenge={}&code_challenge_method=S256&state=composio",
        endpoint,
        pct_encode(client_id),
        pct_encode(redirect_uri),
        pct_encode(scope),
        challenge,
    )
}

fn pct_encode(s: &str) -> String {
    s.bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                String::from(b as char)
            }
            _ => format!("%{:02X}", b),
        })
        .collect()
}

// -- URL parameter extraction --

fn extract_param(url: &str, key: &str) -> Option<String> {
    let query = url.split('?').nth(1)?;
    query
        .split('&')
        .find(|p| p.starts_with(&format!("{key}=")))?
        .strip_prefix(&format!("{key}="))
        .map(|v| v.replace('+', " "))
        .map(|v| pct_decode(&v))
}

fn pct_decode(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c == '%' {
            let hex: String = chars.by_ref().take(2).collect();
            if let Ok(byte) = u8::from_str_radix(&hex, 16) {
                result.push(byte as char);
            }
        } else {
            result.push(c);
        }
    }
    result
}

// -- HTTP response to browser --

async fn send_response(
    stream: &mut tokio::net::TcpStream,
    title: &str,
    message: &str,
) {
    let html = format!(
        concat!(
            "<!DOCTYPE html><html><head><style>",
            "body{{font-family:ui-sans-serif,-apple-system,system-ui,sans-serif;",
            "display:flex;align-items:center;justify-content:center;height:100vh;margin:0;",
            "background:#fff;color:#0d0d0d;flex-direction:column;gap:16px}}",
            "h1{{font-size:20px;font-weight:500;margin:0}}",
            "p{{font-size:14px;color:#676767;margin:0}}",
            "</style></head><body>",
            "<svg viewBox='0 0 412.248 448.898' width='48' height='48' fill='#161615'>",
            "<path d='M54.438,370.05a372.979,372.979,0,0,0,36.546,16.539c42.934,16.457,81.036,26.955,127.045,32.718,38.952,4.879,98.013,6.119,133.934-9.694l.22-28.709,10.9-4.2.1,7.633c.131,9.532,10.175,10.024,10.111,16.564l-.19,19.454a10.892,10.892,0,0,1-5.271,8.79A125.921,125.921,0,0,1,333.1,442.267c-27.35,5.945-54.827,7.61-83.009,6.115A501.786,501.786,0,0,1,135.308,429.09C98.277,418.317,63.295,404.2,30.364,384.378c-1.82-1.1-4.62-4.1-4.586-5.833l.486-25.225,11.07-8.41c1.485-34.5-.533-22.947-14.764-49.9-27.447-52-29.2-106.518-8.847-163.015,9.56,20.2,21.153,38.25,37.42,52.877C37.675,162.726,27.2,139.979,22.078,114.644,58.63,40.233,137.3-5.66,220.15.562c51,3.831,94.258,25.571,130.394,61.982-11.956-3.184-22.192-5.554-33.74-6.752C275.709,24.666,227.275,10.9,176.055,19.538c-20.923,3.528-34,6.957-50.682,16.877L139.5,33.929l15.86-2.793c8.528-1.5,24.632-1.04,33.836-.192,22.661,2.088,53.554,13.706,71.674,28.987-12.6,3.789-24.839,7.031-37.177,12.526C168.9,96.859,123.836,137.377,92.651,188.4c-7.872-2.92-15.5-4.417-23.465-2.461,29.782,6.032,38.956,41.129,31.8,67.976-2.394,8.985-7.428,16.16-14.663,22.377a346.506,346.506,0,0,0,147.25,97.184l12.006,21.237c1.847,3.267.35,10.053.346,14.518C191.213,405.71,137.381,395,88.063,371.576L54.751,355.753a55.521,55.521,0,0,0-.313,14.3m15.8-103.638c8.757-2.088,12.715-9.164,15.688-16.5,3.95-12.971,2.434-27.431-5.321-38.706-5.394-7.843-14.789-12.194-23.84-9.339A20.8,20.8,0,0,0,43.4,214.587c8.355-7.946,19.246-8.317,27.089-.185,12.642,13.106,13.272,37.962-.251,52.01M56.2,335.674c19.3,9.688,37.093,17.6,57.609,25.556l.46-40.938c.063-5.627-7.1-8.159-10.894-7.39-13.274,2.69-5.888,17.088-7.963,29.218L55.617,322.693c-1,4.557-1.287,9.423.582,12.981m139.579,48.288c1.144-4.393,1.22-8.69-.783-11.451a512.739,512.739,0,0,1-66.018-17.972,16.313,16.313,0,0,0-.129,12.157c8.276,2.7,16.239,5.339,24.7,7.329Z'/>",
            "<path d='M325.964,373.522c-78.683,7.33-171.286-41.71-224.763-98.653,20.982-21.383,19.582-56.385,1.375-79.483,14.126-22.058,29.682-42,48.543-59.74C194.08,95.233,252.771,65.207,312.936,67.539c31.512,1.812,71.082,11.318,70.475,49.792a215.176,215.176,0,0,1,7.448,201.107c3.547,38.249-33.525,51.774-64.9,55.084m-156.623-69.56c44.588,29.3,106.347,54.129,159.883,46.515,8.458-1.2,16.5-3.934,24.588-6.324,5-1.476,7.137-5.17,9.631-9.01,48.185-74.159,42.9-170.662-13.764-238.39C301.111,78.61,245.166,94.247,202.936,121.54c-16.981,10.974-32.909,23.164-46.245,38.481-14.795,16.993-20.759,39.234-21.865,61.356-1.175,23.493,5.307,45.09,17.461,64.8a53.6,53.6,0,0,0,17.054,17.788'/>",
            "<path d='M298.533,409.094c-4.467.414-7.883-1.707-9.4-5.237a12.287,12.287,0,0,1,1.075-10.992c1.473-2.484,5.351-4.9,8.887-5.18l31.941-2.488a8.616,8.616,0,0,1,9.262,6.052c.913,3.365.494,9.3-3.5,10.617-12.359,4.06-24.719,5.973-38.264,7.228'/>",
            "<rect width='15.334' height='16.211' transform='translate(258.6 409.939) rotate(-89.717)'/>",
            "<path d='M370.408,283.292c-6.086,17.577-13.539,33.4-26.392,47.208,26.021-57.679,30.288-124.219,4.132-182.266-6.661-14.783-15.007-27.347-24.809-41.076,5.144.8,12.975.86,16.972,4.164,7.836,6.477,12.518,15.527,17.384,24.5,24.5,45.2,29.763,98.227,12.713,147.465'/>",
            "</svg>",
            "<h1>{}</h1><p>{}</p>",
            "</body></html>"
        ),
        title,
        message,
    );
    let resp = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html.len(),
        html
    );
    let _ = stream.write_all(resp.as_bytes()).await;
}

// -- Exchange code for token --

async fn exchange_code(
    token_endpoint: &str,
    code: &str,
    client_id: &str,
    redirect_uri: &str,
    verifier: &str,
) -> Result<TokenResponse, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(token_endpoint)
        .form(&[
            ("grant_type", "authorization_code"),
            ("code", code),
            ("client_id", client_id),
            ("redirect_uri", redirect_uri),
            ("code_verifier", verifier),
        ])
        .send()
        .await
        .map_err(|e| format!("Token exchange failed: {e}"))?;

    let status = resp.status();
    let body = resp.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("Token exchange returned {status}: {body}"));
    }

    serde_json::from_str(&body)
        .map_err(|e| format!("Invalid token response: {e}"))
}

// -- Update keychain --

fn update_keychain_token(
    access_token: &str,
    expires_in: Option<u64>,
    refresh_token: Option<&str>,
) -> Result<(), String> {
    let username = get_username()?;
    let mut data = read_keychain(&username)?;

    if let Some(mcp_oauth) = data.get_mut("mcpOAuth").and_then(|v| v.as_object_mut()) {
        for (key, info) in mcp_oauth.iter_mut() {
            if key.starts_with("composio") {
                if let Some(obj) = info.as_object_mut() {
                    obj.insert(
                        "accessToken".to_string(),
                        serde_json::Value::String(access_token.to_string()),
                    );
                    if let Some(exp) = expires_in {
                        let expires_at = std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs()
                            + exp;
                        obj.insert(
                            "expiresAt".to_string(),
                            serde_json::Value::Number(expires_at.into()),
                        );
                    }
                    if let Some(rt) = refresh_token {
                        obj.insert(
                            "refreshToken".to_string(),
                            serde_json::Value::String(rt.to_string()),
                        );
                    }
                }
                break;
            }
        }
    }

    write_keychain(&username, &data)
}

// -- Keychain helpers --

fn get_username() -> Result<String, String> {
    let output = std::process::Command::new("whoami")
        .output()
        .map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn read_keychain(username: &str) -> Result<serde_json::Value, String> {
    let output = std::process::Command::new("security")
        .args([
            "find-generic-password",
            "-s",
            "Claude Code-credentials",
            "-a",
            username,
            "-w",
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Could not read keychain".to_string());
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(json_str.trim())
        .map_err(|e| format!("Invalid keychain JSON: {e}"))
}

fn write_keychain(
    username: &str,
    data: &serde_json::Value,
) -> Result<(), String> {
    let json = serde_json::to_string(data)
        .map_err(|e| format!("Failed to serialize: {e}"))?;

    let status = std::process::Command::new("security")
        .args([
            "add-generic-password",
            "-U",
            "-s",
            "Claude Code-credentials",
            "-a",
            username,
            "-w",
            &json,
        ])
        .status()
        .map_err(|e| format!("Failed to update keychain: {e}"))?;

    if !status.success() {
        return Err("Failed to update keychain".to_string());
    }
    Ok(())
}
