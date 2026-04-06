use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::workspaces::WorkspaceRoot;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Organization {
    pub id: String,
    pub name: String,
    pub is_default: bool,
    pub created_at: String,
}

// --- Helpers ---

fn orgs_json_path(root: &Path) -> PathBuf {
    root.join("organizations.json")
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

pub fn read_organizations(root: &Path) -> Result<Vec<Organization>, String> {
    let path = orgs_json_path(root);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read organizations.json: {e}"))?;
    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse organizations.json: {e}"))
}

/// Atomic write: write to .tmp then rename.
fn write_organizations(root: &Path, orgs: &[Organization]) -> Result<(), String> {
    let target = orgs_json_path(root);
    let tmp = root.join("organizations.json.tmp");
    let json = serde_json::to_string_pretty(orgs)
        .map_err(|e| format!("Failed to serialize organizations: {e}"))?;
    fs::write(&tmp, &json)
        .map_err(|e| format!("Failed to write organizations.json.tmp: {e}"))?;
    fs::rename(&tmp, &target)
        .map_err(|e| format!("Failed to rename organizations.json: {e}"))?;
    Ok(())
}

/// Resolve an org's folder path from its ID.
pub fn org_folder(root: &Path, org_id: &str) -> Result<PathBuf, String> {
    let orgs = read_organizations(root)?;
    let org = orgs
        .iter()
        .find(|o| o.id == org_id)
        .ok_or_else(|| format!("Organization not found: {org_id}"))?;
    Ok(root.join(&org.name))
}

/// Ensure the default "Personal" org exists. Called on startup.
fn ensure_default_org(root: &Path) -> Result<Vec<Organization>, String> {
    let mut orgs = read_organizations(root)?;
    if orgs.is_empty() {
        let personal = Organization {
            id: Uuid::new_v4().to_string(),
            name: "Personal".to_string(),
            is_default: true,
            created_at: now_iso(),
        };

        // Create the org directory with .houston/connections.json
        let org_dir = root.join("Personal");
        fs::create_dir_all(org_dir.join(".houston"))
            .map_err(|e| format!("Failed to create Personal/.houston: {e}"))?;
        let connections_path = org_dir.join(".houston").join("connections.json");
        if !connections_path.exists() {
            fs::write(&connections_path, "[]")
                .map_err(|e| format!("Failed to write connections.json: {e}"))?;
        }

        orgs.push(personal);
        write_organizations(root, &orgs)?;
    }
    Ok(orgs)
}

// --- Commands ---

#[tauri::command]
pub fn list_organizations(
    root: tauri::State<'_, WorkspaceRoot>,
) -> Result<Vec<Organization>, String> {
    fs::create_dir_all(&root.0)
        .map_err(|e| format!("Failed to create workspace root: {e}"))?;
    ensure_default_org(&root.0)
}

#[tauri::command]
pub fn create_organization(
    root: tauri::State<'_, WorkspaceRoot>,
    name: String,
) -> Result<Organization, String> {
    let mut orgs = read_organizations(&root.0)?;

    // Check for duplicate name
    if orgs.iter().any(|o| o.name == name) {
        return Err(format!("An organization named \"{name}\" already exists"));
    }

    let org = Organization {
        id: Uuid::new_v4().to_string(),
        name: name.clone(),
        is_default: false,
        created_at: now_iso(),
    };

    // Create the org directory with .houston/connections.json
    let org_dir = root.0.join(&name);
    fs::create_dir_all(org_dir.join(".houston"))
        .map_err(|e| format!("Failed to create org directory: {e}"))?;
    let connections_path = org_dir.join(".houston").join("connections.json");
    if !connections_path.exists() {
        fs::write(&connections_path, "[]")
            .map_err(|e| format!("Failed to write connections.json: {e}"))?;
    }

    orgs.push(org.clone());
    write_organizations(&root.0, &orgs)?;
    Ok(org)
}

#[tauri::command]
pub fn rename_organization(
    root: tauri::State<'_, WorkspaceRoot>,
    id: String,
    new_name: String,
) -> Result<Organization, String> {
    let mut orgs = read_organizations(&root.0)?;

    // Check for duplicate name
    if orgs.iter().any(|o| o.name == new_name && o.id != id) {
        return Err(format!(
            "An organization named \"{new_name}\" already exists"
        ));
    }

    let org = orgs
        .iter_mut()
        .find(|o| o.id == id)
        .ok_or_else(|| format!("Organization not found: {id}"))?;

    let old_name = org.name.clone();
    let old_dir = root.0.join(&old_name);
    let new_dir = root.0.join(&new_name);

    if new_dir.exists() && old_dir != new_dir {
        return Err(format!(
            "A directory named \"{new_name}\" already exists"
        ));
    }

    // Rename the directory
    if old_dir.exists() {
        fs::rename(&old_dir, &new_dir)
            .map_err(|e| format!("Failed to rename org directory: {e}"))?;
    }

    org.name = new_name;
    let updated = org.clone();
    write_organizations(&root.0, &orgs)?;
    Ok(updated)
}

#[tauri::command]
pub fn delete_organization(
    root: tauri::State<'_, WorkspaceRoot>,
    id: String,
) -> Result<(), String> {
    let orgs = read_organizations(&root.0)?;

    let org = orgs
        .iter()
        .find(|o| o.id == id)
        .ok_or_else(|| format!("Organization not found: {id}"))?;

    if org.is_default {
        return Err("Cannot delete the default organization".to_string());
    }

    let org_dir = root.0.join(&org.name);

    // Remove from list
    let remaining: Vec<Organization> = orgs.into_iter().filter(|o| o.id != id).collect();
    write_organizations(&root.0, &remaining)?;

    // Delete directory
    if org_dir.exists() {
        fs::remove_dir_all(&org_dir)
            .map_err(|e| format!("Failed to delete org directory: {e}"))?;
    }

    Ok(())
}
