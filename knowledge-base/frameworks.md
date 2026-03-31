# Keel & Deck — Frameworks & Patterns

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | 19 |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS | 4 (Vite plugin, no PostCSS config) |
| Components | shadcn/ui (New York style, Stone base) | Latest |
| Animation | Framer Motion | 12 |
| Icons | Lucide React | Latest |
| Build | pnpm workspaces | — |

---

## Package Architecture

### Workspace Layout
This is a pnpm monorepo. Each package under `packages/` is a self-contained npm package.

```
packages/
├── core/     → @deck-ui/core     (peer dep of all others)
├── chat/     → @deck-ui/chat     (depends on core)
├── board/    → @deck-ui/board    (depends on core)
└── layout/   → @deck-ui/layout   (depends on core)
```

### Dependency Rules
- `@deck-ui/core` has NO internal package dependencies
- All other packages peer-depend on `@deck-ui/core`
- No package depends on another non-core package
- React is always a peer dependency, never a direct dependency

### Import Patterns
Within a package, use **relative imports**:
```typescript
import { cn } from "../utils"
import { Button } from "./button"
```

Between packages, use **package imports**:
```typescript
import { cn, Button } from "@deck-ui/core"
```

**Never use `@/` path aliases.** They don't work in published libraries.

---

## Component Patterns

### Props over stores
Every component is props-driven. No Zustand, no global state, no context providers (except internal component state like collapsible/dialog).

**Why:** These components are consumed by apps that have their own state management. We don't dictate how data flows — we just render what we're given.

### Render props for extensibility
When a component needs customizable rendering (e.g., ChatPanel's tool results), use render props:
```typescript
interface ChatPanelProps {
  renderToolResult?: (tool: ToolCall) => ReactNode
  isSpecialTool?: (name: string) => boolean
}
```

### Slots for composition
When a component has optional regions, use children or named ReactNode props:
```typescript
interface TabBarProps {
  actions?: ReactNode   // right-side action buttons
  menu?: ReactNode      // settings dropdown
}
```

---

## shadcn/ui Patterns

### All components follow shadcn conventions:
- `data-slot` attributes on every element for CSS targeting
- `cn()` utility for class composition (clsx + tailwind-merge)
- Radix UI primitives as headless base for complex components
- CVA (class-variance-authority) for variant management
- `asChild` pattern via Radix `Slot` for component composition

### Adding new shadcn components:
1. Check Houston first — it may already have the component
2. Use `npx shadcn@latest add <component>` in a scratch project
3. Copy to `packages/core/src/components/`
4. Update imports: `@/lib/utils` → `../utils`, `@/components/ui/X` → `./X`
5. Export from `packages/core/src/index.ts`

---

## Tailwind CSS 4

Tailwind 4 uses the Vite plugin (`@tailwindcss/vite`), NOT PostCSS. There is:
- No `tailwind.config.ts`
- No `postcss.config.js`
- Configuration is in `globals.css` via `@theme` blocks

### CSS Custom Properties
All design tokens are CSS custom properties defined in `globals.css`. Apps consuming these packages must import the CSS:
```typescript
import "@deck-ui/core/src/globals.css"
```

---

## Framer Motion Patterns

### Board card animations
```typescript
<AnimatePresence mode="popLayout">
  <motion.div
    key={item.id}
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
  />
</AnimatePresence>
```

### Key rules:
- Always use `layout` prop for items that reorder
- Use `AnimatePresence` with `mode="popLayout"` for lists
- Keep transitions under 0.3s — snappy, not slow
- Exit animations go upward (y: -8), enter from below (y: 8)

---

## Type Patterns

### Generic interfaces
Board and chat components use minimal, generic interfaces:

```typescript
// Board
interface BoardItem {
  id: string
  title: string
  subtitle?: string
  status: string
  updatedAt: string
}

// Chat
interface FeedItem {
  type: "user_message" | "assistant_text" | "thinking" | "tool_call" | ...
  content: string
  timestamp?: string
}
```

### No Houston types
These packages must NEVER import Houston-specific types (Issue, Skill, Routine, etc.). If a Houston type needs to be used with a Deck component, Houston maps it to the generic type at the app level.

---

## Rust Crate Patterns

### Session Runner (`keel-tauri/session_runner.rs`)
Generic lifecycle for spawning a Claude session and monitoring its output. Replaces the duplicated "spawn + tokio::spawn + match update" pattern.

```rust
let handle = spawn_and_monitor(
    &app_handle,
    session_key,
    prompt,
    resume_id,          // Option<String> for --resume
    working_dir,        // Option<PathBuf>
    system_prompt,      // Option<String>
    Some(chat_state),   // ChatSessionState for session ID tracking
    Some(PersistOptions { db, project_id, feed_key, source }),
);
// handle.await => SessionResult { response_text, claude_session_id, error }
```

**What it does automatically:**
- Emits `KeelEvent::FeedItem` and `KeelEvent::SessionStatus` via Tauri events
- Tracks `claude_session_id` in `ChatSessionState` (enables `--resume` on next send)
- Persists non-streaming feed items to `chat_feed` table (skips `*_streaming` variants)
- Returns `SessionResult` with final response text, session ID, and any error

### Channel Manager (`keel-tauri/channel_manager.rs`)
Bridges keel-channels adapters with the Tauri event system.

```rust
let (manager, mut message_rx) = ChannelManager::new();
// Start a channel
manager.start_channel("tg-main".into(), config).await?;
// Consume incoming messages from ALL channels
while let Some((registry_id, msg)) = message_rx.recv().await {
    // Route to agent, emit events, etc.
}
```

**Key design:** All channels feed into one `mpsc::UnboundedReceiver<RoutedMessage>`. The app decides how to route — e.g., inject into the chat feed as `[Telegram] message text`.

### Workspace Helpers (`keel-tauri/workspace.rs`)
For apps that use an OpenClaw-style workspace directory with editable personality/context files.

- `seed_file(dir, name, content)` — write once, never overwrite user edits
- `build_system_prompt(dir, base, bootstrap_name, files)` — assemble prompt from workspace files
- `list_files(dir, known)` / `read_file(dir, name, allowed)` — UI-safe file enumeration

### Chat Session State (`keel-tauri/chat_session.rs`)
`Arc<Mutex<Option<String>>>` wrapper for tracking a Claude session ID. Register as Tauri managed state. `session_runner` auto-updates it when `SessionUpdate::SessionId` arrives.

### Feed Persistence (`keel-db/repo_chat_feed.rs`)
`chat_feed` table with `(project_id, feed_key, feed_type, data_json, source, timestamp)`. Used for:
- Restoring conversation history on app restart
- Multi-source attribution (desktop vs telegram vs slack messages)
- Session runner auto-persists via `PersistOptions`

### Feed Merge (`@deck-ui/chat/feed-merge.ts`)
Pure function `mergeFeedItem(items, item)` for smart-merging streaming FeedItems:
- `thinking_streaming` replaces previous `thinking_streaming`
- `thinking` (final) replaces last `thinking_streaming`
- `assistant_text_streaming` replaces previous `assistant_text_streaming`
- `assistant_text` (final) replaces last `assistant_text_streaming`
- Everything else appended

Use in Zustand/Redux stores to avoid duplicating merge logic across apps.

### Channel Avatars (`@deck-ui/chat/channel-avatar.tsx`)
`ChannelAvatar` component renders branded circular badges for message sources. Props: `source: "telegram" | "slack" | string`, `size: "sm" | "md"`. Used via `ChatPanel.renderMessageAvatar` callback.

`ChatMessage.source` is auto-extracted by `feedItemsToMessages()` from `[ChannelName]` prefixes in user messages (e.g., `[Telegram] hello` becomes `source: "telegram"`, text: `"hello"`).

---

## Gotchas

1. **Tailwind v4 has no config file.** Don't create `tailwind.config.ts`. All config is in CSS.
2. **No `@/` aliases in library code.** They work in apps but break in published packages. Use relative imports.
3. **`motion` vs `framer-motion`:** Both packages exist in deps. `motion` is the newer name. Import from `motion` for the `Motion.create()` API, `framer-motion` for `AnimatePresence`, `motion.div`, etc.
4. **streamdown CSS:** ChatPanel needs `streamdown/styles.css` imported by the consuming app, not by the library.
5. **Toast container is props-driven.** Unlike Houston where it reads from UIStore, Deck's ToastContainer accepts `toasts` and `onDismiss` as props.
6. **`expand_tilde()` is required for user-facing paths.** Rust's `PathBuf` does not expand `~`. Use `keel_tauri::paths::expand_tilde()` whenever accepting paths like `~/Documents/MyApp`.
7. **`send_typing()` is a default no-op on Channel trait.** Only Telegram implements it (sends `sendChatAction` typing). Slack does not. Safe to call on any channel.
