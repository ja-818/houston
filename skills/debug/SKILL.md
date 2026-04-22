---
name: debug
description: Debug bugs in Houston. NEVER guess. Read log files first (backend + frontend). Add targeted tracing/logger if not enough info. Never ask user to copy-paste terminal output.
---

# /debug

**NEVER guess.** Logs always faster than speculation.

## The rule

Bug occurs + fix not obvious →
1. **Read log files FIRST.** They have all errors.
2. Diagnose from ACTUAL error in logs. Not assumptions.
3. Not enough info? Add targeted `tracing::debug!()` (Rust) or `logger.debug()` (TS).
4. **Never** ask user to copy-paste terminal output. Read logs directly.

## Log locations

| Layer | File | Contents |
|-------|------|----------|
| Backend | `~/.houston/logs/backend.log` | Rust tracing — sessions, agent store, channels, watcher |
| Frontend | `~/.houston/logs/frontend.log` | JS console.error/warn, React crashes, Tauri cmd failures |

Both daily rolling. Latest = current file.

## Logging APIs

### Rust
```rust
tracing::info!("session {id} started");
tracing::warn!(?error, "unexpected");
tracing::error!(?err, "failed to write");
tracing::debug!(agent = %agent_id, "received event");
```
Output → `backend.log` via `tracing-subscriber` + daily rolling file appender.

Levels: default `info` globally. `debug` for `houston_terminal_manager` + `houston_tauri`. Override: `RUST_LOG=debug,crate_name=trace`.

### Frontend
```typescript
import { logger } from "@/lib/logger";
logger.error("fetch failed", { url, status });
logger.warn("retry", { attempt });
logger.info("user clicked");
logger.debug("render", { props });
```
Also `console.error` + `console.warn` patched to auto-write to `frontend.log`.

## Bug reports

"Report bug" button on error toasts auto-attaches last 50 lines from both logs.

## Adding tracing when logs insufficient

1. Identify suspected code path
2. Add `tracing::debug!(?relevant_vars, "descriptive message")` at branch points
3. Commit to `claude/wip`
4. Ask user to reproduce
5. Read updated logs
6. Fix w/ actual knowledge

Don't leave debug logs in. Remove after fix or downgrade to `trace!`.

## Anti-patterns

- ❌ "Let me try X and see if it fixes it" → guess
- ❌ "Can you share the terminal output?" → read the logs yourself
- ❌ `unwrap()` to silence compile errors → hides real failure
- ❌ `let _ = x.await` on ops that can fail → silent failure (banned by style rules)

## Quick checks

```bash
# Tail backend
tail -f ~/.houston/logs/backend.log

# Last 100 lines
tail -100 ~/.houston/logs/backend.log

# Grep for pattern
grep -i error ~/.houston/logs/backend.log
```

Use the dedicated Read tool, not bash `cat`/`head`/`tail`, when operating through Claude Code.
