use serde_json::{json, Value};

pub fn run(command: Option<&str>, pretty: bool) {
    let schema = match command {
        Some(cmd) => command_schema(cmd),
        None => all_schemas(),
    };

    let text = if pretty {
        serde_json::to_string_pretty(&schema).expect("JSON serialization failed")
    } else {
        serde_json::to_string(&schema).expect("JSON serialization failed")
    };
    println!("{text}");
}

fn all_schemas() -> Value {
    json!({
        "commands": {
            "task.create": command_schema("task.create"),
            "task.list": command_schema("task.list"),
            "task.update": command_schema("task.update"),
            "task.delete": command_schema("task.delete"),
            "routine.create": command_schema("routine.create"),
            "routine.list": command_schema("routine.list"),
            "routine.update": command_schema("routine.update"),
            "routine.delete": command_schema("routine.delete"),
            "routine.pause": command_schema("routine.pause"),
            "routine.resume": command_schema("routine.resume"),
            "routine.history": command_schema("routine.history"),
            "routine.run": command_schema("routine.run"),
        }
    })
}

fn command_schema(cmd: &str) -> Value {
    match cmd {
        "task.create" => json!({
            "command": "keel task create",
            "description": "Create a new task on the kanban board",
            "args": {
                "--title": { "type": "string", "required": true },
                "--description": { "type": "string", "required": false },
                "--tags": { "type": "string", "required": false, "description": "Comma-separated" },
                "--depends-on": { "type": "string", "required": false, "description": "Comma-separated task IDs" },
            },
            "requires": ["--project-id"],
        }),
        "task.list" => json!({
            "command": "keel task list",
            "description": "List tasks for a project",
            "args": {
                "--status": { "type": "string", "required": false, "enum": ["queue", "running", "needs_you", "done", "cancelled"] },
            },
            "requires": ["--project-id"],
        }),
        "task.update" => json!({
            "command": "keel task update <ID>",
            "description": "Update an existing task",
            "args": {
                "id": { "type": "string", "required": true, "positional": true },
                "--title": { "type": "string", "required": false },
                "--description": { "type": "string", "required": false },
                "--status": { "type": "string", "required": false, "enum": ["queue", "running", "needs_you", "done", "cancelled"] },
                "--tags": { "type": "string", "required": false, "description": "Comma-separated" },
            },
            "requires": ["--project-id"],
        }),
        "task.delete" => json!({
            "command": "keel task delete <ID>",
            "description": "Delete a task",
            "args": {
                "id": { "type": "string", "required": true, "positional": true },
            },
            "requires": ["--project-id"],
        }),
        "routine.create" => json!({
            "command": "keel routine create",
            "description": "Create a new routine",
            "args": {
                "--project-id": { "type": "string", "required": true },
                "--name": { "type": "string", "required": true },
                "--trigger": { "type": "string", "required": true, "enum": ["manual", "daily", "weekly", "on_change"] },
                "--description": { "type": "string", "required": false },
                "--trigger-config": { "type": "string", "required": false, "description": "JSON configuration" },
            },
            "requires": [],
        }),
        "routine.list" => json!({
            "command": "keel routine list",
            "description": "List routines for a project",
            "args": {
                "--project-id": { "type": "string", "required": true },
            },
            "requires": [],
        }),
        "routine.update" => json!({
            "command": "keel routine update <ID>",
            "description": "Update an existing routine",
            "args": {
                "id": { "type": "string", "required": true, "positional": true },
                "--name": { "type": "string", "required": false },
                "--trigger": { "type": "string", "required": false },
                "--description": { "type": "string", "required": false },
                "--trigger-config": { "type": "string", "required": false },
                "--status": { "type": "string", "required": false, "enum": ["active", "paused", "archived"] },
            },
            "requires": [],
        }),
        "routine.delete" => json!({
            "command": "keel routine delete <ID>",
            "description": "Delete a routine",
            "args": {
                "id": { "type": "string", "required": true, "positional": true },
            },
            "requires": [],
        }),
        "routine.pause" => json!({
            "command": "keel routine pause <ID>",
            "description": "Pause a routine",
            "args": {
                "id": { "type": "string", "required": true, "positional": true },
            },
            "requires": [],
        }),
        "routine.resume" => json!({
            "command": "keel routine resume <ID>",
            "description": "Resume a paused routine",
            "args": {
                "id": { "type": "string", "required": true, "positional": true },
            },
            "requires": [],
        }),
        "routine.history" => json!({
            "command": "keel routine history <ID>",
            "description": "Show run history for a routine",
            "args": {
                "id": { "type": "string", "required": true, "positional": true },
                "--limit": { "type": "integer", "required": false, "default": 10 },
            },
            "requires": [],
        }),
        "routine.run" => json!({
            "command": "keel routine run <ID>",
            "description": "Start a new run for a routine",
            "args": {
                "id": { "type": "string", "required": true, "positional": true },
            },
            "requires": [],
        }),
        _ => json!({ "error": format!("Unknown command: {cmd}") }),
    }
}
