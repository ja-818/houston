//! OS-native app update helpers.
//!
//! On macOS the updater replaces the `.app` bundle while the old process is
//! still alive. Generic process relaunch can resolve to the moved backup
//! bundle, so the frontend captures the original app path before install and
//! asks this module to open that path after install.

use std::path::{Path, PathBuf};

#[tauri::command(rename_all = "snake_case")]
pub fn current_app_bundle_path() -> Result<String, String> {
    let exe = std::env::current_exe()
        .map_err(|e| format!("Failed to resolve current executable: {e}"))?;
    Ok(app_path_from_exe(&exe).display().to_string())
}

#[tauri::command(rename_all = "snake_case")]
pub fn relaunch_app_from_path(app_path: String) -> Result<(), String> {
    let path = PathBuf::from(app_path);
    if !path.exists() {
        return Err(format!("App path does not exist: {}", path.display()));
    }

    launch_app(&path)?;
    std::process::exit(0);
}

fn app_path_from_exe(exe: &Path) -> PathBuf {
    #[cfg(target_os = "macos")]
    if let Some(bundle) = macos_bundle_path_from_exe(exe) {
        return bundle;
    }

    exe.to_path_buf()
}

#[cfg(target_os = "macos")]
fn macos_bundle_path_from_exe(exe: &Path) -> Option<PathBuf> {
    let macos_dir = exe.parent()?;
    if macos_dir.file_name()? != "MacOS" {
        return None;
    }

    let contents_dir = macos_dir.parent()?;
    if contents_dir.file_name()? != "Contents" {
        return None;
    }

    contents_dir.parent().map(PathBuf::from)
}

#[cfg(target_os = "macos")]
fn launch_app(path: &Path) -> Result<(), String> {
    std::process::Command::new("open")
        .arg("-n")
        .arg(path)
        .spawn()
        .map_err(|e| format!("Failed to relaunch Houston: {e}"))?;
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn launch_app(path: &Path) -> Result<(), String> {
    std::process::Command::new(path)
        .spawn()
        .map_err(|e| format!("Failed to relaunch Houston: {e}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::app_path_from_exe;
    use std::path::PathBuf;

    #[test]
    #[cfg(target_os = "macos")]
    fn resolves_macos_bundle_from_executable_path() {
        let exe = PathBuf::from("/Applications/Houston.app/Contents/MacOS/Houston");
        assert_eq!(
            app_path_from_exe(&exe),
            PathBuf::from("/Applications/Houston.app")
        );
    }

    #[test]
    #[cfg(not(target_os = "macos"))]
    fn uses_executable_path_off_macos() {
        let exe = PathBuf::from("/opt/houston/houston");
        assert_eq!(app_path_from_exe(&exe), exe);
    }
}
