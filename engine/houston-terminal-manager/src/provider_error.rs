pub const MALFORMED_PROVIDER_JSON_MESSAGE: &str =
    "Claude could not read this conversation because it contains broken characters. Remove unusual pasted symbols or start a new mission, then try again.";

pub fn is_malformed_provider_json_error(message: &str) -> bool {
    let lower = message.to_lowercase();
    lower.contains("request body is not valid json") && lower.contains("no low surrogate in string")
}

/// OpenAI rejects coding-specialised models (gpt-5.5-codex, gpt-5-codex …)
/// with a 400 when the user is authenticated via a ChatGPT account whose plan
/// does not include them. The error message OpenAI returns is verbatim:
/// "The 'gpt-5.5-codex' model is not supported when using Codex with a ChatGPT account."
/// The CLI surfaces it through both `turn.failed.error.message` and stderr.
pub fn is_codex_model_unsupported_chatgpt_error(message: &str) -> bool {
    let lower = message.to_lowercase();
    lower.contains("is not supported when using codex with a chatgpt account")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_anthropic_low_surrogate_error() {
        let message = r#"API Error: 400 {"type":"error","error":{"type":"invalid_request_error","message":"The request body is not valid JSON: no low surrogate in string: line 1 column 459046 (char 459045)"}}"#;

        assert!(is_malformed_provider_json_error(message));
    }

    #[test]
    fn ignores_other_json_errors() {
        assert!(!is_malformed_provider_json_error(
            "The request body is not valid JSON: expected value at line 1 column 1",
        ));
    }

    #[test]
    fn ignores_low_surrogate_without_provider_json_signature() {
        assert!(!is_malformed_provider_json_error(
            "no low surrogate in string",
        ));
    }

    #[test]
    fn detects_codex_chatgpt_model_unsupported_error() {
        let message = r#"Error: {"type":"error","status":400,"error":{"type":"invalid_request_error","message":"The 'gpt-5.5-codex' model is not supported when using Codex with a ChatGPT account."}}"#;
        assert!(is_codex_model_unsupported_chatgpt_error(message));
    }

    #[test]
    fn detects_chatgpt_model_unsupported_case_insensitive() {
        let message = "the 'gpt-5-codex' MODEL IS NOT SUPPORTED WHEN USING CODEX WITH A CHATGPT ACCOUNT.";
        assert!(is_codex_model_unsupported_chatgpt_error(message));
    }

    #[test]
    fn ignores_other_codex_400s() {
        assert!(!is_codex_model_unsupported_chatgpt_error(
            "Error: {\"type\":\"error\",\"status\":400,\"error\":{\"message\":\"context window exceeded\"}}"
        ));
    }
}
