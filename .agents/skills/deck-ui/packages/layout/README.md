# @deck-ui/layout

App-level layout primitives. Sidebar for navigation, tab bar for view switching, split view for panels.

## Install

```bash
pnpm add @deck-ui/layout
```

## Usage

```tsx
import { AppSidebar, TabBar, SplitView } from "@deck-ui/layout"
import "@deck-ui/layout/src/styles.css"

<AppSidebar
  logo={<Logo />}
  items={projects}
  selectedId={activeId}
  onSelect={setActiveId}
  onAdd={createProject}
/>

<TabBar
  tabs={[
    { id: "board", label: "Board" },
    { id: "chat", label: "Chat", badge: 2 },
  ]}
  activeTab={currentTab}
  onTabChange={setCurrentTab}
/>
```

## Exports

- `AppSidebar` -- project/chat list sidebar with logo, add, delete, keyboard shortcuts
- `TabBar` -- horizontal tab strip with badges and action slots
- `SplitView` -- two-pane layout with resizable divider
- `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` -- lower-level resizable primitives

## Peer Dependencies

- React 19+
- @deck-ui/core

---

Part of [Keel & Deck](../../README.md).
