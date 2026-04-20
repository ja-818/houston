/**
 * OS-native Tauri IPC bridge.
 *
 * Phase 3 of the engine split (see `.claude/plans/distributed-churning-muffin.md`)
 * funnels every Tauri IPC call through this single module so that the rest of
 * `app/src/` talks to the engine over HTTP/WS. Two classes of calls live here:
 *
 *  1. **OS-native helpers** (`osRevealFile`, `osPickDirectory`, …). These probe
 *     the user's local machine (Finder, open URL, terminal, local Claude CLI)
 *     and will NEVER move to the engine — the engine may run on a remote VPS.
 *
 *  2. **Legacy transport passthrough** (`legacyInvoke`, `legacyListen`,
 *     `legacyEmit`). Used by `lib/tauri.ts` and friends when
 *     `VITE_HOUSTON_USE_ENGINE_SERVER` is off, or for Tauri commands that do
 *     not yet have a `/v1/*` counterpart (e.g. onboarding, routine scheduler).
 *     Phase 4 deletes these once every domain call has a REST route.
 *
 * Invariant enforced by CI (exit criterion of Phase 3):
 *     grep -rn "invoke(" app/src/  # only matches this file
 */

import { invoke } from "@tauri-apps/api/core";
import { listen, emit, type Event, type UnlistenFn } from "@tauri-apps/api/event";

// ── Legacy transport passthrough ──────────────────────────────────────

export function legacyInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(cmd, args);
}

export function legacyListen<T>(
  event: string,
  handler: (ev: Event<T>) => void,
): Promise<UnlistenFn> {
  return listen<T>(event, handler);
}

export function legacyEmit(event: string, payload?: unknown): Promise<void> {
  return emit(event, payload);
}

// ── OS-native helpers ─────────────────────────────────────────────────

/** macOS folder picker (osascript). */
export function osPickDirectory(): Promise<string | null> {
  return invoke<string | null>("pick_directory");
}

/** Open a URL in the user's default browser. */
export function osOpenUrl(url: string): Promise<void> {
  return invoke<void>("open_url", { url });
}

/** Reveal an agent-relative file in Finder / Explorer. */
export function osRevealFile(agentPath: string, relativePath: string): Promise<void> {
  return invoke<void>("reveal_file", { agent_path: agentPath, relative_path: relativePath });
}

/** Reveal the agent's folder in Finder / Explorer. */
export function osRevealAgent(agentPath: string): Promise<void> {
  return invoke<void>("reveal_agent", { agent_path: agentPath });
}

/** Open an agent-relative file with the user's default application. */
export function osOpenFile(agentPath: string, relativePath: string): Promise<void> {
  return invoke<void>("open_file", { agent_path: agentPath, relative_path: relativePath });
}

/** Launch a terminal app scoped to the given path. */
export function osOpenTerminal(
  path: string,
  command?: string,
  terminalApp?: string,
): Promise<void> {
  return invoke<void>("open_terminal", {
    path,
    command: command ?? null,
    terminal_app: terminalApp ?? null,
  });
}

/** Is the Claude CLI installed on this machine? */
export function osCheckClaudeCli(): Promise<boolean> {
  return invoke<boolean>("check_claude_cli");
}

/** Append a line to `~/Library/Application Support/houston/logs/frontend.log`. */
export function osWriteFrontendLog(
  level: "error" | "warn" | "info" | "debug",
  message: string,
  context?: string,
): Promise<void> {
  return invoke<void>("write_frontend_log", { level, message, context });
}

/** Read the last N lines from backend + frontend log files. */
export function osReadRecentLogs(
  lines = 50,
): Promise<{ backend: string; frontend: string }> {
  return invoke<{ backend: string; frontend: string }>("read_recent_logs", { lines });
}
