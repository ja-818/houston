pub const MALFORMED_PROVIDER_JSON_MESSAGE: &str =
    "Claude could not read this conversation because it contains broken characters. Remove unusual pasted symbols or start a new mission, then try again.";

pub fn is_malformed_provider_json_error(message: &str) -> bool {
    let lower = message.to_lowercase();
    lower.contains("request body is not valid json") && lower.contains("no low surrogate in string")
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
}
