use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

/// Status of an issue on the kanban board.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IssueStatus {
    Queue,
    Running,
    NeedsYou,
    Done,
    Cancelled,
}

impl IssueStatus {
    pub const ALL: &[IssueStatus] = &[
        IssueStatus::Queue,
        IssueStatus::Running,
        IssueStatus::NeedsYou,
        IssueStatus::Done,
        IssueStatus::Cancelled,
    ];

    pub fn label(&self) -> &'static str {
        match self {
            IssueStatus::Queue => "Queue",
            IssueStatus::Running => "Running",
            IssueStatus::NeedsYou => "Needs You",
            IssueStatus::Done => "Done",
            IssueStatus::Cancelled => "Cancelled",
        }
    }
}

impl fmt::Display for IssueStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_ref())
    }
}

impl FromStr for IssueStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "queue" => Ok(IssueStatus::Queue),
            "running" => Ok(IssueStatus::Running),
            "needs_you" => Ok(IssueStatus::NeedsYou),
            "done" => Ok(IssueStatus::Done),
            "cancelled" => Ok(IssueStatus::Cancelled),
            other => Err(format!("invalid issue status: {other}")),
        }
    }
}

impl AsRef<str> for IssueStatus {
    fn as_ref(&self) -> &str {
        match self {
            IssueStatus::Queue => "queue",
            IssueStatus::Running => "running",
            IssueStatus::NeedsYou => "needs_you",
            IssueStatus::Done => "done",
            IssueStatus::Cancelled => "cancelled",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn issue_status_roundtrip() {
        for s in IssueStatus::ALL {
            assert_eq!(*s, s.to_string().parse::<IssueStatus>().unwrap());
        }
    }

    #[test]
    fn issue_status_serde_roundtrip() {
        for s in IssueStatus::ALL {
            let json = serde_json::to_string(s).unwrap();
            assert_eq!(*s, serde_json::from_str::<IssueStatus>(&json).unwrap());
        }
    }

    #[test]
    fn issue_status_invalid() {
        assert!("banana".parse::<IssueStatus>().is_err());
    }

    #[test]
    fn issue_status_labels() {
        for s in IssueStatus::ALL {
            assert!(!s.label().is_empty());
        }
    }
}
