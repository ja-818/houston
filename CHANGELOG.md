# Changelog

All notable changes to Houston will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-04-06

### Added
- **Spaces** — top-level organizational container (replaces "Organization"). Space switcher in sidebar, CRUD commands in Rust, `useSpaceStore` in frontend
- **Dashboard view** — grid overview of all workspaces in current space
- **Connections view** — space-scoped channel and service management
- **Per-task Claude sessions** — each kanban card is a Claude conversation with its own session and chat history
- **Kanban column `onAdd` button** — "+" button in column headers for creating tasks directly from the board
- **New conversation panel** — dedicated panel for starting conversations on tasks
- **ChatSidebar** — progress tracking sidebar showing step checklist + channels list, moved to `@houston-ai/chat`
- **Floating progress card** — `ProgressPanel` alongside chat for real-time agent progress
- **`.houston/prompts/` convention** — editable system prompt components (`system.md`, `self-improvement.md`)
- **Context tab** — editable CLAUDE.md + prompt files in the workspace

### Changed
- Renamed "Organization" to "Space" across app, stores, and Rust commands
- Standardized sidebar layout: Space switcher + Dashboard + Connections + AI Workspaces
- Extended `AppSidebar` to support workspace management (rename, delete, create)
- Sidebar width now persists via preferences
- All Tauri invoke parameter names use `snake_case` to match Rust
- All Tauri command errors surface as toasts (no silent failures)

### Fixed
- Chat history persistence — conversations survive app restarts
- Tab persistence across workspace switches
- Delete/rename parameter passing to Tauri commands
- Empty states for all tabs
- Preference commands (serde camelCase alignment)
- ContentArea wrapper removed — tab layouts and centering fixed
- Compiler warnings cleaned up

## [0.1.0] — 2026-04-05

### Added
- Houston unified app with experience system
- Experience manifests (JSON-only and custom React tiers)
- Workspace management (create, rename, delete)
- 10 built-in tab components (chat, board, skills, files, connections, context, routines, channels, events, learnings)
- 11 React packages (@houston-ai/core, chat, board, layout, workspace, skills, connections, events, routines, review, memory)
- 8 Rust crates (houston-sessions, houston-db, houston-tauri, houston-channels, houston-events, houston-scheduler, houston-memory, houston-skills)
- create-houston-experience CLI
- Component showcase app

### Changed
- Rebranded from Keel & Deck to Houston
- Workspace convention: .keel/ → .houston/
- Events: KeelEvent → HoustonEvent

[0.2.0]: https://github.com/ja-818/houston/releases/tag/v0.2.0
[0.1.0]: https://github.com/ja-818/houston/releases/tag/v0.1.0
