//! CRUD operations for `.houston/channels.json`.

use super::helpers::{read_json, write_json};
use super::types::{ChannelEntry, NewChannel};
use std::path::Path;
use uuid::Uuid;

const FILE: &str = "channels.json";

pub fn list(root: &Path) -> Result<Vec<ChannelEntry>, String> {
    read_json::<Vec<ChannelEntry>>(root, FILE)
}

pub fn add(root: &Path, input: NewChannel) -> Result<ChannelEntry, String> {
    let mut channels = list(root)?;
    let entry = ChannelEntry {
        id: Uuid::new_v4().to_string(),
        channel_type: input.channel_type,
        name: input.name,
        token: input.token,
    };
    channels.push(entry.clone());
    write_json(root, FILE, &channels)?;
    Ok(entry)
}

pub fn remove(root: &Path, id: &str) -> Result<(), String> {
    let mut channels = list(root)?;
    let before = channels.len();
    channels.retain(|c| c.id != id);
    if channels.len() == before {
        return Err(format!("Channel not found: {id}"));
    }
    write_json(root, FILE, &channels)
}
