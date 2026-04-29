pub fn normalize_toolkit_slug(slug: &str) -> String {
    slug.trim().to_ascii_lowercase()
}

pub fn normalize_toolkit_slugs(slugs: Vec<String>) -> Vec<String> {
    let mut normalized = slugs
        .into_iter()
        .map(|slug| normalize_toolkit_slug(&slug))
        .filter(|slug| !slug.is_empty())
        .collect::<Vec<_>>();
    normalized.sort();
    normalized.dedup();
    normalized
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_toolkit_slug() {
        assert_eq!(normalize_toolkit_slug(" POSTHOG "), "posthog");
    }

    #[test]
    fn normalizes_dedupes_and_sorts_toolkit_slugs() {
        assert_eq!(
            normalize_toolkit_slugs(vec![
                "GMAIL".into(),
                "posthog".into(),
                "gmail".into(),
                "".into(),
                " PostHog ".into(),
            ]),
            vec!["gmail", "posthog"]
        );
    }
}
