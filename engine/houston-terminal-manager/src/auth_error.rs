//! Shared detection for provider CLI authentication failures.

pub const AUTH_RETRY_MARKER: &str = "__auth_retry__";

pub fn is_auth_retry_marker(message: &str) -> bool {
    message == AUTH_RETRY_MARKER
}

pub fn is_auth_error(message: &str) -> bool {
    let lower = message.to_lowercase();
    let api_key_problem = lower.contains("api key")
        && (lower.contains("invalid")
            || lower.contains("missing")
            || lower.contains("not set")
            || lower.contains("expired"));
    lower.contains("401")
        || lower.contains("unauthorized")
        || lower.contains("not authenticated")
        || lower.contains("not logged in")
        || lower.contains("authentication expired")
        || lower.contains("auth expired")
        || lower.contains("session expired")
        || lower.contains("oauth token")
        || lower.contains("missing bearer")
        || lower.contains("invalid api key")
        || lower.contains("invalid_api_key")
        || api_key_problem
        || lower.contains("no auth credentials")
        || lower.contains("please login")
        || lower.contains("please log in")
        || lower.contains("please run /login")
        || lower.contains("run claude auth login")
        || lower.contains("run codex login")
        || lower.contains("claude auth login")
        || lower.contains("codex login")
}

pub fn is_auth_retry_noise(message: &str) -> bool {
    let lower = message.to_lowercase();
    is_auth_error(message) && (lower.contains("reconnecting") || lower.contains("retrying"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_common_cli_auth_failures() {
        let cases = [
            "unexpected status 401 Unauthorized: Missing bearer",
            "Claude Code is not authenticated. Run claude auth login",
            "Not logged in · Please run /login",
            "Invalid API key. Please login again.",
            "No API key found. Run claude auth login",
            "OAuth token has expired",
            "Reconnecting... 1/5 (unexpected status 401 Unauthorized)",
        ];

        for case in cases {
            assert!(is_auth_error(case), "{case}");
        }
    }

    #[test]
    fn detects_retry_noise_subset() {
        assert!(is_auth_retry_noise(
            "Reconnecting... 1/5 (unexpected status 401 Unauthorized)",
        ));
        assert!(!is_auth_retry_noise("Invalid API key. Please login again."));
    }
}
