# Houston — Design System

Houston uses a unified design system. This document is the single reference for all UI decisions.

**Origin:** Follows ChatGPT's visual language — near-black primary, monochrome palette, clean typography, minimal chrome.

---

## Brand Personality

**Capable, calm, invisible.** Houston is a quiet expert that does the work while users do something else. Not flashy, not corporate, not techy. It should feel like texting a brilliant assistant.

**Anti-references:** Jira, Linear, Notion — anything that feels like a "tool for engineers." No dense toolbars, no keyboard-shortcut culture, no configuration overload.

---

## Design Principles

1. **Show, don't configure.** Every screen should have one obvious thing to do. No settings panels, no mode switches, no "advanced options." If something can be inferred, infer it.
2. **Always feel alive.** When AI is working, the user must see movement every second — streaming text, spinning loaders, tool activity counters, glowing borders. Silence = broken. Progress = trust.
3. **Chat is the interface.** The primary interaction is a chat conversation. Everything else (board, files, skills) is supporting structure.
4. **Non-technical by default.** Labels say "Prompt" not "Description." Status says "Needs You" not "In Review." Every word tested against: "Would my mom understand this?"
5. **Invisible borders, visible actions.** Borders are nearly invisible (5-15% opacity). Depth comes from background color shifts and subtle shadows. But action buttons (Start, Approve, Delete) are always visible — never hidden behind hover states.

---

## Color System

### Gray Scale (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | `#f9f9f9` | Sidebar bg, secondary surfaces |
| `gray-100` | `#ececec` | Sidebar hover, tertiary surfaces, user message bubbles |
| `gray-200` | `#e3e3e3` | Sidebar pressed, dividers |
| `gray-300` | `#cdcdcd` | Borders, separators |
| `gray-400` | `#b4b4b4` | Disabled states |
| `gray-500` | `#9b9b9b` | Placeholder-adjacent |
| `gray-600` | `#676767` | Secondary text |
| `gray-700` | `#424242` | Body text, icons |
| `gray-950` | `#0d0d0d` | **Primary text, primary buttons** |

**Key rule:** Near-black (`#0d0d0d`), never pure `#000000`. Near-white (`#f9f9f9`), never stark contrast jumps.

### CSS Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#ffffff` | App background |
| `--foreground` | `#0d0d0d` | Primary text |
| `--secondary` | `#f9f9f9` | Sidebar, card backgrounds |
| `--muted-foreground` | `#5d5d5d` | Secondary text |
| `--border` | `#e5e5e5` | Borders, dividers |
| `--ring` | `#0d0d0d` | Focus rings |
| `--accent` | `#f5f5f5` | Hover backgrounds |

### Semantic Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Text primary | `#0d0d0d` | Main body text, headings |
| Text secondary | `#5d5d5d` | Muted text, footer |
| Text tertiary | `#8f8f8f` | Disabled icons, tertiary text |
| Text placeholder | `rgba(0,0,0,0.7)` | Input placeholder |
| Text error | `#f93a37` | Error states |
| Surface primary | `#ffffff` | Main content background |
| Surface secondary | `#f9f9f9` | Slightly off-white surfaces |
| Surface tertiary | `#ececec` | User message bubble bg |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| Border light | `rgba(13,13,13,0.05)` | Very subtle borders (5% opacity) |
| Border medium | `rgba(0,0,0,0.15)` | Standard borders (15% opacity) |
| Border heavy | `rgba(13,13,13,0.15)` | Emphasized borders |
| Border xheavy | `rgba(0,0,0,0.25)` | Strong borders |

### Status Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#00a240` | Completed, approved |
| Info/Link | `#0169cc` / `#2964aa` | Links, info states |
| Warning | `#e0ac00` | Caution states |
| Danger | `#e02e2a` | Error, destructive actions |

### Color Restraint

The UI is almost entirely grayscale. Color appears ONLY for:
1. The glowing comet border on running task cards (blue->indigo->orange gradient)
2. Success/error status indicators
3. Agent avatars / channel avatars
4. Links

Never decorative color. Light mode only (for now).

---

## Brand Theming

Override `--color-primary` via CSS custom properties in globals.css:

```css
/* Import core first, then override */
@import "@houston-ai/core/src/globals.css";

@theme {
  --color-primary: #c0392b;           /* Custom brand color */
  --color-primary-foreground: #ffffff;
  --color-ring: #c0392b;
}
```

Every component using `bg-primary`, `text-primary-foreground`, etc. automatically picks up the brand color. **Never hardcode hex values** — always use semantic tokens.

| Default | Primary | Name |
|---------|---------|------|
| Houston | `#0d0d0d` | Near-black |

---

## Typography

### Font Stacks
```css
/* Sans (primary) */
font-family: ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;

/* Monospace (code) */
font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

No custom web fonts — system font stack for native feel.

### Type Scale

| Element | Size | Weight | Line-Height | Tailwind |
|---------|------|--------|-------------|----------|
| Page heading (h1) | 28px | 400 | 34px | `text-[28px]` |
| Model selector | 18px | 400 | — | `text-lg` |
| Body text | 16px | 400 | 24px | `text-base` |
| Input text | 16px | 400 | 24px | `text-base` |
| Buttons | 14px | 500 | — | `text-sm font-medium` |
| Sidebar items | 14px | 400 | — | `text-sm` |
| Small labels | 12px | 400 | — | `text-xs` |

### Section Headers
- Sentence case, never `uppercase` or `tracking-wider`
- `text-sm font-medium text-[#0d0d0d]` — look like regular content, not screaming labels

---

## Buttons

### Primary (Black Pill)
```
bg-gray-950 text-white rounded-full h-9 px-3 text-sm font-medium
border border-transparent hover:bg-gray-800 transition-colors
```

### Secondary (Outline Pill)
```
bg-white text-gray-950 rounded-full h-9 px-3 text-sm font-medium
border border-black/15 hover:bg-gray-50 transition-colors
```

### Ghost/Icon Button
```
bg-transparent text-gray-950 rounded-lg w-9 h-9
hover:bg-[#f3f3f3] transition-colors
```

### Soft/Chip Button
```
bg-gray-100 text-gray-950 rounded-full h-9 px-3
hover:bg-gray-200 transition-colors
```

### Large Variant
```
h-11 px-4  (instead of h-9 px-3)
```

**Key rule:** Pill shapes everywhere. Buttons are `rounded-full`.

---

## Input / Composer

The signature chat input — a rounded pill with a multi-layered shadow:

```
max-w-3xl w-full rounded-[28px] bg-white p-2.5
shadow-[0_4px_4px_rgba(0,0,0,0.04),0_4px_80px_8px_rgba(0,0,0,0.04),0_0_1px_rgba(0,0,0,0.62)]
```

- Textarea: 16px, system sans-serif, transparent bg
- Placeholder: "Ask anything" style, `text-black/70`
- Grid layout: leading (attach) | primary (text) | trailing (send button)

---

## Message Bubbles

### User Messages
```
ml-auto max-w-[70%] rounded-3xl bg-[#f4f4f4] px-5 py-2.5 text-gray-950
```
Right-aligned, visible bubble.

### Assistant Messages
No bubble. Plain text/markdown, left-aligned, transparent background.

---

## Component Patterns

### Cards
- White background, subtle border (`border-black/5`)
- Rounded corners (`rounded-xl`)
- Hover: slight shadow elevation
- Running state: `card-running-glow` animation border

### Badges
- Active: black bg, white text (pill shape)
- Inactive: gray bg, gray text
- Small, `rounded-full`

### Input Fields
- Minimal border
- Focus: ring outline
- Auto-expand textareas where appropriate

### Empty States
- Use `Empty` from `@houston-ai/core` — big `text-2xl font-semibold` title, description, optional action button
- No icon-in-a-box pattern — just text
- All containers must be `flex flex-col` for `flex-1 justify-center` to work
- Action button: primary style, `rounded-full`

### Progress Panel
`ProgressPanel` from `@houston-ai/chat` — a step-by-step checklist rendered alongside the chat panel.

- Agent calls `update_progress({ steps: [{ title, status }] })` during execution
- `useProgressSteps()` hook extracts the latest progress from the feed
- Step states: **pending** (empty circle), **active** (spinning loader, highlighted text), **done** (green filled checkmark)
- Header shows "X of Y steps complete"
- Renders as a narrow right-side panel alongside `ChatPanel` in the app's chat tab

---

## Sidebar

The app sidebar follows a two-tier navigation pattern:

```
+---------------------------+
| [SpaceSwitcher] [Settings]|  Select/create spaces
|---------------------------|
| Dashboard                 |  Global nav items
| Connections               |
|---------------------------|
| Your AI Workspaces        |  Section header
|   Research Agent          |  Workspace items (sorted by recency)
|   Project Manager         |
|   + New Workspace         |  Create action
+---------------------------+
```

- **Width:** 200px fixed, `#f5f5f5` bg
- **Items:** `text-sm`, `py-1.5 px-2.5`, `rounded-lg` on hover
- **Active state:** `bg-gray-200` background
- **Section headers:** `text-xs font-medium text-muted-foreground`, uppercase
- **SpaceSwitcher:** dropdown in the sidebar header, shows current space name + chevron

---

## Layout

### App Shell (with sidebar)
```
+---------------------------------------------+
| Sidebar | Tab Bar              | Right Panel |
| (200px) |----------------------| (optional)  |
|         | Main Content         |             |
|         |                      |             |
+---------------------------------------------+
```

### Key Dimensions

| Element | Size | Tailwind |
|---------|------|----------|
| Sidebar | 200px fixed, `#f5f5f5` bg | — |
| Tab bar | full width, underline active | — |
| Right panel | 45% width, 380px min | — |
| Split view | resizable, default 55/45 | — |
| Standard buttons | 36px height | `h-9` |
| Large buttons | 44px height | `h-11` |
| Icon buttons | 36x36px | `w-9 h-9` |
| Header bar | ~52px | `h-[52px]` |
| Chat max-width | 768px | `max-w-3xl` |

### Border Radius Scale

| Value | Tailwind | Usage |
|-------|----------|-------|
| 0.25rem | `rounded` | Small chips, tags |
| 0.375rem | `rounded-md` | Inputs, small cards |
| 0.5rem | `rounded-lg` | Sidebar items, icon buttons |
| 0.75rem | `rounded-xl` | Cards, panels |
| 1rem | `rounded-2xl` | Large cards, dialogs |
| 28px | `rounded-[28px]` | Composer input pill |
| 9999px | `rounded-full` | Pill buttons, avatars |

### Common Spacing

| Element | Value | Tailwind |
|---------|-------|----------|
| Composer inner | 10px | `p-2.5` |
| Button horizontal | 12px | `px-3` |
| Large button horizontal | 16px | `px-4` |
| Sidebar item | 6px 10px | `py-1.5 px-2.5` |
| Content area | centered, 768px max | `mx-auto max-w-3xl` |
| Message gap | 16-24px | `gap-4` to `gap-6` |

---

## Shadows

### Composer Shadow (signature)
```css
box-shadow:
  0 4px 4px rgba(0,0,0,0.04),     /* soft close shadow */
  0 4px 80px 8px rgba(0,0,0,0.04), /* wide ambient glow */
  0 0 1px rgba(0,0,0,0.62);        /* crisp outline */
```

### Edge Shadows (subtle separators)
```css
0 1px 0 rgba(0,0,0,0.05);   /* top edge */
0 -1px 0 rgba(0,0,0,0.05);  /* bottom edge */
```

**The composer shadow is the MAIN depth cue.** Everything else is flat or uses 1px edge shadows.

---

## Animation

### card-running-glow
The signature animation. Rotating conic-gradient border on active AI agent cards.
- Colors: transparent -> blue (#3b82f6) -> indigo (#818cf8) -> orange (#f97316) -> yellow
- Duration: 2.5s infinite
- Creates a "comet tail" effect around the card border

### Framer Motion (Board)
- Card enter: `opacity: 0, y: 8` -> `opacity: 1, y: 0`
- Card exit: `opacity: 0, y: -8`
- Duration: 0.2s, easing: `[0.25, 0.1, 0.25, 1]`
- `AnimatePresence` with `popLayout` mode

### Spring Physics (preferred)
```tsx
const springTransition = { type: "spring", stiffness: 300, damping: 30, mass: 1 };
```

### Duration Reference
| Speed | Duration | Usage |
|-------|----------|-------|
| Fast | 0.2s | Hover states, color transitions |
| Common | 0.667s | Standard spring transitions |
| Bounce | 0.833s | Bouncy feedback |
| Elegant | 0.582s | Polished UI transitions |

### Other Animations
- `typing-bounce` — 3-dot typing indicator with vertical translation + opacity
- `tool-pulse` — pulsing dot (scale + opacity) for active tool calls, 1s duration

### Key Rules
- Always use `layout` prop for items that reorder
- Use `AnimatePresence` with `mode="popLayout"` for lists
- Keep transitions under 0.3s — snappy, not slow
- Spring physics over mechanical CSS easing

---

## Icons

Use Lucide React. Stroke-based line icons:
- Standard size: 20px (`h-5 w-5`)
- Small: 16px (`h-4 w-4`)
- Large: 24px (`h-6 w-6`)
- Stroke width: 2px (standard) or 1.5px (lighter)
- Color: `currentColor` (inherits)

**No emoji as icons.** Use Lucide React icons or real logos.

---

## Rules Summary

1. **No emoji as icons.** Use Lucide or real logos.
2. **No hover-only affordances.** All interactive elements must be visible without hovering.
3. **Monochrome by default.** Color only for status, emphasis, and brand overrides.
4. **Compact, not cramped.** Generous whitespace but no wasted space.
5. **Animations serve purpose.** Running glow = feedback. Card transitions = spatial orientation. No decorative animation.
6. **Pill shapes for buttons.** `rounded-full` everywhere.
7. **Brand via tokens only.** Never hardcode brand hex values.

---

## Design Skills Workflow

For any UI/UX work, use these skills in order:

1. **`/critique`** — Before building. Evaluate the design direction.
2. **`/normalize`** — After building. Ensure it matches this design system.
3. **`/polish`** — Final pass before shipping. Alignment, spacing, consistency.

Use when relevant:
- `/frontend-design` — Creating new pages or major components from scratch
- `/clarify` — Writing UX copy, error messages, labels
- `/onboard` — Onboarding, empty states, first-time UX
- `/distill` — When a screen feels overloaded
- `/animate` — Adding transitions or micro-interactions
- `/audit` — Accessibility, performance, responsive checks
- `/harden` — Edge cases, error states, resilience
