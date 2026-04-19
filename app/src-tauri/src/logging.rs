use std::fs;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{fmt, EnvFilter};

/// Guard kept alive for the entire process lifetime via OnceLock.
static GUARD: OnceLock<WorkerGuard> = OnceLock::new();

/// Initialize tracing with file output.
/// Call once at app startup, before any other code runs.
pub fn init(data_dir: &Path) {
    let logs_dir = data_dir.join("logs");
    fs::create_dir_all(&logs_dir).ok();

    let file_appender = tracing_appender::rolling::daily(&logs_dir, "backend.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    // Store the guard so the background writer thread stays alive
    let _ = GUARD.set(guard);

    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,houston_terminal_manager=debug,houston_tauri=debug,houston_app=debug"));

    fmt()
        .with_env_filter(filter)
        .with_writer(non_blocking)
        .with_ansi(false)
        .with_target(true)
        .with_thread_ids(false)
        .with_file(true)
        .with_line_number(true)
        .init();
}

fn logs_dir() -> PathBuf {
    houston_tauri::houston_db::db::houston_dir().join("logs")
}

fn frontend_log_path() -> PathBuf {
    logs_dir().join("frontend.log")
}

/// Tauri command: frontend writes log entries here.
#[tauri::command]
pub fn write_frontend_log(level: String, message: String, context: Option<String>) {
    let logs = logs_dir();
    fs::create_dir_all(&logs).ok();

    let timestamp = chrono::Utc::now().to_rfc3339();
    let ctx = context.as_deref().unwrap_or("");
    let line = if ctx.is_empty() {
        format!("{timestamp} [{level}] {message}\n")
    } else {
        format!("{timestamp} [{level}] {message} | {ctx}\n")
    };

    use std::io::Write;
    if let Ok(mut f) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(frontend_log_path())
    {
        let _ = f.write_all(line.as_bytes());
    }
}

/// Tauri command: read the last N lines from both log files.
/// Returns { backend: string, frontend: string }.
#[tauri::command]
pub fn read_recent_logs(lines: Option<usize>) -> serde_json::Value {
    let n = lines.unwrap_or(100);
    let backend = tail_file(&logs_dir().join("backend.log"), n);
    let frontend = tail_file(&frontend_log_path(), n);
    serde_json::json!({ "backend": backend, "frontend": frontend })
}

fn tail_file(path: &Path, n: usize) -> String {
    match fs::read_to_string(path) {
        Ok(content) => {
            let lines: Vec<&str> = content.lines().collect();
            let start = lines.len().saturating_sub(n);
            lines[start..].join("\n")
        }
        Err(_) => String::new(),
    }
}
