use std::path::{Path, PathBuf};

/// Expand a leading `~` to the user's home directory.
///
/// Shell tilde expansion doesn't happen in Rust's `PathBuf`.
/// Use this when accepting user-facing paths like `~/Documents/MyApp`.
pub fn expand_tilde(path: &Path) -> PathBuf {
    if path.starts_with("~") {
        if let Ok(home) = std::env::var("HOME") {
            PathBuf::from(home).join(path.strip_prefix("~").unwrap_or(path))
        } else {
            path.to_path_buf()
        }
    } else {
        path.to_path_buf()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn expands_tilde() {
        let result = expand_tilde(Path::new("~/Documents/Test"));
        assert!(!result.starts_with("~"));
        assert!(result.to_string_lossy().ends_with("Documents/Test"));
    }

    #[test]
    fn leaves_absolute_paths_alone() {
        let result = expand_tilde(Path::new("/tmp/test"));
        assert_eq!(result, PathBuf::from("/tmp/test"));
    }

    #[test]
    fn handles_bare_tilde() {
        let result = expand_tilde(Path::new("~"));
        assert!(!result.to_string_lossy().contains('~'));
    }
}
