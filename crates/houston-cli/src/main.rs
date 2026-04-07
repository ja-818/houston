mod routine;
mod routine_ops;
mod schema;
mod activity;
mod activity_ops;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "houston", about = "Manage AI agent activity and routines")]
struct Cli {
    /// Path to SQLite database file
    #[arg(long)]
    db_path: String,

    /// Project ID scope (required for most commands)
    #[arg(long)]
    project_id: Option<String>,

    /// Issue ID to exclude from list output (e.g. conversation tracking issue)
    #[arg(long)]
    exclude_issue: Option<String>,

    /// Pretty-print JSON output for human readability
    #[arg(long)]
    pretty: bool,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Manage activity on the kanban board
    Activity {
        #[command(subcommand)]
        action: activity::ActivityAction,
    },
    /// Manage recurring routines
    Routine {
        #[command(subcommand)]
        action: routine::RoutineAction,
    },
    /// Output command schemas for runtime introspection
    Schema {
        /// Specific command to show schema for (e.g. "activity.create")
        command: Option<String>,
    },
}

fn output_json(value: &serde_json::Value, pretty: bool) {
    let text = if pretty {
        serde_json::to_string_pretty(value).expect("JSON serialization failed")
    } else {
        serde_json::to_string(value).expect("JSON serialization failed")
    };
    println!("{text}");
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    if let Commands::Schema { command } = &cli.command {
        schema::run(command.as_deref(), cli.pretty);
        return;
    }

    let db = match houston_db::Database::connect_with_path(&cli.db_path).await {
        Ok(db) => db,
        Err(e) => {
            eprintln!("Error: Failed to open database: {e}");
            std::process::exit(1);
        }
    };

    let result = match cli.command {
        Commands::Activity { action } => {
            let project_id = match cli.project_id {
                Some(ref id) => id.as_str(),
                None => {
                    eprintln!("Error: --project-id is required for activity commands");
                    std::process::exit(1);
                }
            };
            activity::run(&db, project_id, cli.exclude_issue.as_deref(), action).await
        }
        Commands::Routine { action } => {
            routine::run(&db, cli.project_id.as_deref(), action).await
        }
        Commands::Schema { .. } => unreachable!(),
    };

    match result {
        Ok(value) => output_json(&value, cli.pretty),
        Err(e) => {
            let err = serde_json::json!({ "error": e.to_string() });
            let text = if cli.pretty {
                serde_json::to_string_pretty(&err).unwrap()
            } else {
                serde_json::to_string(&err).unwrap()
            };
            eprintln!("{text}");
            std::process::exit(1);
        }
    }
}
