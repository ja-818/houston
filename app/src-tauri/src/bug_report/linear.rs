use serde::{Deserialize, Serialize};

use super::format::{format_issue_description, format_issue_title};
use super::linear_graphql::post_graphql;
use super::BugReportPayload;

const ISSUE_CREATE_MUTATION: &str = r#"
mutation HoustonBugReportCreate($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue {
      id
      identifier
      url
    }
  }
}
"#;

const LABEL_QUERY: &str = r#"
query HoustonBugReportLabel($teamId: String!, $labelName: String!) {
  team(id: $teamId) {
    labels(first: 10, filter: { name: { eq: $labelName } }) {
      nodes {
        id
        name
      }
    }
  }
}
"#;

pub(super) async fn send_bug_report_to(
    api_url: &str,
    api_key: &str,
    team_id: &str,
    label_name: &str,
    payload: &BugReportPayload,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let label_id = resolve_label_id(&client, api_url, api_key, team_id, label_name).await?;

    let data = post_graphql::<LinearIssueCreateData, _>(
        &client,
        api_url,
        api_key,
        ISSUE_CREATE_MUTATION,
        LinearIssueCreateVariables {
            input: LinearIssueCreateInput::from_payload(team_id, label_id, payload),
        },
    )
    .await?;
    let issue_create = data
        .issue_create
        .ok_or_else(|| "Linear API response did not include issueCreate data".to_string())?;

    if !issue_create.success {
        return Err("Linear issue creation failed".to_string());
    }

    let issue = issue_create
        .issue
        .ok_or_else(|| "Linear issue creation succeeded without issue data".to_string())?;

    tracing::info!(
        issue_id = %issue.id,
        issue_identifier = issue.identifier.as_deref().unwrap_or("unknown"),
        issue_url = issue.url.as_deref().unwrap_or("unknown"),
        "Linear bug report created"
    );

    Ok(())
}

async fn resolve_label_id(
    client: &reqwest::Client,
    api_url: &str,
    api_key: &str,
    team_id: &str,
    label_name: &str,
) -> Result<String, String> {
    let data = post_graphql::<LinearLabelData, _>(
        client,
        api_url,
        api_key,
        LABEL_QUERY,
        LinearLabelVariables {
            team_id: team_id.to_string(),
            label_name: label_name.to_string(),
        },
    )
    .await?;
    let labels = data
        .team
        .ok_or_else(|| format!("Linear team not found: {team_id}"))?
        .labels
        .nodes;

    labels
        .into_iter()
        .find(|label| label.name == label_name)
        .map(|label| label.id)
        .ok_or_else(|| format!("Linear bug label not found: {label_name}"))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LinearLabelVariables {
    team_id: String,
    label_name: String,
}

#[derive(Serialize)]
struct LinearIssueCreateVariables {
    input: LinearIssueCreateInput,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LinearIssueCreateInput {
    team_id: String,
    title: String,
    description: String,
    label_ids: Vec<String>,
}

impl LinearIssueCreateInput {
    fn from_payload(team_id: &str, label_id: String, payload: &BugReportPayload) -> Self {
        Self {
            team_id: team_id.to_string(),
            title: format_issue_title(payload),
            description: format_issue_description(payload),
            label_ids: vec![label_id],
        }
    }
}

#[derive(Deserialize)]
struct LinearLabelData {
    team: Option<LinearLabelTeam>,
}

#[derive(Deserialize)]
struct LinearLabelTeam {
    labels: LinearLabelConnection,
}

#[derive(Deserialize)]
struct LinearLabelConnection {
    nodes: Vec<LinearLabel>,
}

#[derive(Deserialize)]
struct LinearLabel {
    id: String,
    name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LinearIssueCreateData {
    issue_create: Option<LinearIssueCreatePayload>,
}

#[derive(Deserialize)]
struct LinearIssueCreatePayload {
    success: bool,
    issue: Option<LinearIssue>,
}

#[derive(Deserialize)]
struct LinearIssue {
    id: String,
    identifier: Option<String>,
    url: Option<String>,
}
