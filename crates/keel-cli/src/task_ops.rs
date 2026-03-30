use anyhow::{bail, Result};
use keel_db::Database;
use serde_json::{json, Value};

pub async fn update(
    db: &Database,
    task_id: &str,
    exclude_issue: Option<&str>,
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    tags: Option<String>,
) -> Result<Value> {
    if exclude_issue == Some(task_id) {
        bail!("Cannot modify the conversation tracking task.");
    }

    let issue = db
        .get_issue(task_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Task not found: {task_id}"))?;

    let mut changes = Vec::new();

    if let Some(ref new_title) = title {
        let desc = description.as_deref().unwrap_or(&issue.description);
        db.update_issue_title_desc(task_id, new_title, desc).await?;
        changes.push(format!("title -> '{new_title}'"));
    } else if let Some(ref desc) = description {
        db.update_issue_title_desc(task_id, &issue.title, desc)
            .await?;
        changes.push("description updated".into());
    }

    if let Some(ref status_str) = status {
        let parsed: keel_db::IssueStatus = status_str
            .parse()
            .map_err(|e: String| anyhow::anyhow!(e))?;
        db.update_issue_status(task_id, parsed).await?;
        changes.push(format!("status -> '{status_str}'"));
    }

    if let Some(ref tags_str) = tags {
        let json = super::task::tags_to_json(tags_str);
        db.update_issue_tags(task_id, &json).await?;
        changes.push(format!("tags -> '{tags_str}'"));
    }

    // Re-read the updated issue.
    let updated = db
        .get_issue(task_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Task disappeared after update"))?;

    let mut result = super::task::task_to_json(&updated);
    result
        .as_object_mut()
        .unwrap()
        .insert("changes".into(), json!(changes));
    Ok(result)
}

pub async fn delete(
    db: &Database,
    task_id: &str,
    exclude_issue: Option<&str>,
) -> Result<Value> {
    if exclude_issue == Some(task_id) {
        bail!("Cannot delete the conversation tracking task.");
    }

    let issue = db
        .get_issue(task_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Task not found: {task_id}"))?;

    db.delete_issue(task_id).await?;

    Ok(json!({
        "deleted": true,
        "id": issue.id,
        "title": issue.title,
    }))
}
