use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize)]
pub struct InstalledExperience {
    pub manifest: serde_json::Value,
    pub path: String,
}

fn experiences_dir() -> PathBuf {
    let home = dirs::home_dir().expect("No home directory found");
    home.join(".houston").join("experiences")
}

#[tauri::command(rename_all = "snake_case")]
pub fn list_installed_experiences() -> Result<Vec<InstalledExperience>, String> {
    let dir = experiences_dir();
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create experiences directory: {e}"))?;

    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let mut experiences = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let manifest_path = path.join("manifest.json");
        if !manifest_path.exists() {
            continue;
        }
        match fs::read_to_string(&manifest_path) {
            Ok(contents) => match serde_json::from_str::<serde_json::Value>(&contents) {
                Ok(manifest) => {
                    experiences.push(InstalledExperience {
                        manifest,
                        path: path.to_string_lossy().to_string(),
                    });
                }
                Err(e) => {
                    eprintln!(
                        "[experiences] failed to parse {}: {e}",
                        manifest_path.display()
                    );
                }
            },
            Err(e) => {
                eprintln!(
                    "[experiences] failed to read {}: {e}",
                    manifest_path.display()
                );
            }
        }
    }

    Ok(experiences)
}
