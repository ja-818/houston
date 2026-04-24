# Platform Matrix — Rust (engine/) layer

Status of Windows support at the engine's Rust surface as of this
commit. CI wiring (matrix build, artifact naming, updater targets)
is owned by Wave 2 / E₂ and not tracked here.

## Build verification

| Target | Status | How verified |
|--------|--------|--------------|
| `aarch64-apple-darwin` | ✅ native | `cargo test --workspace --exclude houston-app --exclude houston-tauri` |
| `x86_64-apple-darwin` | ✅ (inherits Darwin code paths) | — |
| `x86_64-unknown-linux-gnu` | ✅ (inherits Unix code paths) | — |
| `x86_64-pc-windows-gnu` | ✅ `cargo check` clean | `cargo check --target x86_64-pc-windows-gnu -p houston-engine-server` with `mingw-w64` toolchain |
| `x86_64-pc-windows-msvc` | ⚠️ untested on macOS host — `ring`'s build script needs MSVC CRT headers (fetch via `xwin` or build on Windows) | — |

The two Windows targets share the same Rust source. MSVC vs GNU differs
only in CRT/linker — every `cfg(windows)` branch in Houston applies to
both.

## Cross-platform primitives — in use

- **Home dir**: `dirs::home_dir()` (HOME on Unix, USERPROFILE on
  Windows). `std::env::var("HOME")` is banned in engine code.
- **PATH manipulation**: `std::env::split_paths` / `std::env::join_paths`
  — never hand-roll the separator.
- **Symlinks**: `std::os::unix::fs::symlink` on Unix,
  `std::os::windows::fs::symlink_file` / `symlink_dir` on Windows.
  Both branches wired in `agents_crud.rs`, `agents/prompt.rs`,
  `skills.rs`.
- **PTY**: `portable-pty` (used in `houston-terminal-manager::manager`)
  — ConPTY-backed on Windows 10+, no code change needed.
- **File watcher**: `notify` — native backends on each OS.

## Platform-specific branches

| Area | File | Unix | Windows |
|------|------|------|---------|
| Session cancel | `engine-core/src/sessions/mod.rs::cancel` | `kill -TERM <pid>` | `taskkill /PID <pid> /T /F` |
| `engine.json` perms | `engine-server/src/main.rs::write_manifest` | `chmod 0o600` | inherits NTFS ACL from parent (sufficient; user dir is per-user) |
| Composio installer | `houston-composio/src/install.rs::install` | `bash -c "curl \| bash"` | returns a clear error — auto-install not wired (see **gaps** below) |
| Composio executable check | `houston-composio/src/install.rs::is_installed` | file + `+x` bit | file existence only (NTFS has no POSIX +x; Composio installer drops `composio.exe`) |
| Composio CLI path | same | `~/.composio/composio` | `~/.composio/composio.exe` |
| Login-shell PATH probe | `houston-terminal-manager/src/claude_path.rs` | `/bin/zsh -l -c 'echo $PATH'`, fallback `/bin/bash -l`, `-i` | skipped — inherited process PATH is already the user PATH |
| Common-install-dir probe | same | `~/.local/bin`, `/opt/homebrew/bin`, `/usr/local/bin`, `~/.cargo/bin`, `~/.composio`, nvm node dirs | `~\.cargo\bin`, `~\.composio`, `~\AppData\Roaming\npm`, `~\AppData\Local\Programs\claude` |
| Command-exists check | same `is_command_available` | bare filename | bare + `.exe`/`.cmd`/`.bat`/`.ps1` variants |

## Known gaps — Windows needs a follow-up

1. **Composio CLI install**: Windows path surfaces an error pointing the
   user at <https://composio.dev/install>. Composio publishes a
   PowerShell installer; wiring it in needs a real Windows box to test
   SHA checksum, install directory, and PATH-append semantics.
2. **Claude / Codex CLI discovery**: `COMMON_CLAUDE_DIRS` on Windows is
   a best guess (npm global dir, cargo bin, a plausible
   `AppData\Local\Programs\claude`). Needs validation against actual
   Claude Code / Codex Windows distributions once they publish.
3. **nvm on Windows** (`nvm-windows` by coreybutler) lives at
   `%APPDATA%\nvm\v<ver>\` with a different shape than nvm.sh — not
   yet probed; Node tools installed via nvm-windows won't be picked up
   unless they're on PATH already.
4. **Process-group kill**: on Unix we `kill -TERM` the single PID we
   tracked; Windows uses `taskkill /T` which walks the child tree.
   Semantics differ — Windows is forceful (`/F`) because Console
   applications don't respond to clean-shutdown signals unless they're
   in our console group. If this becomes a problem (e.g. sessions that
   need graceful Claude shutdown to flush token caches), switch to
   `GenerateConsoleCtrlEvent` via a detached child console.
5. **MSVC target build**: not verified on the macOS host. CI on Windows
   runners (E₂'s scope) is the authoritative check. Cross-compile from
   macOS would need `xwin` (MSVC SDK headers) — not installed locally.

## Deliberately untouched in this pass

- `app/` and `ui/` Windows support — owned by Wave 2 / E₂.
- `.github/workflows/*` matrix — owned by Wave 2 / E₂.
- `houston-composio::cli`, `::auth`, `::mcp` — these call `whoami`,
  `open`, `security` (macOS `security(1)`), which will not work on
  Windows either. They compile (process spawns fail at runtime with a
  clear I/O error), but the features that depend on them are not
  expected to work on Windows without additional work. Left out of
  scope to keep this diff tight.
