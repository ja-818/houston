use anyhow::Result;
use clap::Subcommand;
use keel_db::Database;
use serde_json::{json, Value};

#[derive(Subcommand)]
pub enum TaskAction {
    /// Create a new task
    Create {
        /// Title of the task
        #[arg(long)]
        title: String,
        /// Detailed description
        #[arg(long)]
        description: Option<String>,
        /// Comma-separated tags
        #[arg(long)]
        tags: Option<String>,
        /// IDs of tasks that must finish first (comma-separated)
        #[arg(long)]
        depends_on: Option<String>,
    },
    /// List tasks for the project
    List {
        /// Filter by status: queue, running, needs_you, done, cancelled
        #[arg(long)]
        status: Option<String>,
    },
    /// Update an existing task
    Update {
        /// Task ID to update
        id: String,
        /// New title
        #[arg(long)]
        title: Option<String>,
        /// New description
        #[arg(long)]
        description: Option<String>,
        /// New status: queue, running, needs_you, done, cancelled
        #[arg(long)]
        status: Option<String>,
        /// Comma-separated tags (replaces existing)
        #[arg(long)]
        tags: Option<String>,
    },
    /// Delete a task
    Delete {
        /// Task ID to delete
        id: String,
    },
}

pub async fn run(
    db: &Database,
    project_id: &str,
    exclude_issue: Option<&str>,
    action: TaskAction,
) -> Result<Value> {
    match action {
        TaskAction::Create {
            title,
            description,
            tags,
            depends_on,
        } => create(db, project_id, &title, description, tags, depends_on).await,
        TaskAction::List { status } => list(db, project_id, exclude_issue, status).await,
        TaskAction::Update {
            id,
            title,
            description,
            status,
            tags,
        } => {
            crate::task_ops::update(db, &id, exclude_issue, title, description, status, tags)
                .await
        }
        TaskAction::Delete { id } => crate::task_ops::delete(db, &id, exclude_issue).await,
    }
}

async fn create(
    db: &Database,
    project_id: &str,
    title: &str,
    description: Option<String>,
    tags: Option<String>,
    depends_on: Option<String>,
) -> Result<Value> {
    let tags_json = tags.as_deref().map(tags_to_json);
    let issue = db
        .create_issue(
            project_id,
            title,
            description.as_deref().unwrap_or(""),
            tags_json.as_deref(),
        )
        .await?;

    if let Some(dep_str) = depends_on {
        let dep_ids: Vec<&str> = dep_str.split(',').map(|s| s.trim()).collect();
        for dep_id in &dep_ids {
            db.add_issue_dependency(&issue.id, dep_id).await?;
        }
    }

    Ok(task_to_json(&issue))
}

async fn list(
    db: &Database,
    project_id: &str,
    exclude_issue: Option<&str>,
    status_filter: Option<String>,
) -> Result<Value> {
    let issues = db.list_issues(project_id).await?;

    let issues: Vec<_> = match exclude_issue {
        Some(exc_id) => issues.into_iter().filter(|i| i.id != exc_id).collect(),
        None => issues,
    };

    let filtered: Vec<_> = if let Some(ref status_str) = status_filter {
        let status: keel_db::IssueStatus = status_str
            .parse()
            .map_err(|e: String| anyhow::anyhow!(e))?;
        issues.into_iter().filter(|i| i.status == status).collect()
    } else {
        issues
    };

    let tasks: Vec<Value> = filtered.iter().map(task_to_json).collect();
    Ok(json!(tasks))
}

pub(crate) fn task_to_json(issue: &keel_db::Issue) -> Value {
    json!({
        "id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "status": issue.status.to_string(),
        "tags": issue.parsed_tags(),
        "blocked_by": issue.blocked_by_ids,
        "created_at": issue.created_at,
        "updated_at": issue.updated_at,
    })
}

pub(crate) fn tags_to_json(tags: &str) -> String {
    let list: Vec<&str> = tags
        .split(',')
        .map(|t| t.trim())
        .filter(|t| !t.is_empty())
        .collect();
    serde_json::to_string(&list).unwrap_or_else(|_| "[]".into())
}
