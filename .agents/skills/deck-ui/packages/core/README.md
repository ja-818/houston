# @deck-ui/core

Foundation layer for Deck. 36 shadcn/ui components, design tokens, CSS animations, and utilities.

## Install

```bash
pnpm add @deck-ui/core
```

## Usage

```tsx
import { Button, Badge, Card, Tooltip } from "@deck-ui/core"
import "@deck-ui/core/src/globals.css"

<Button variant="default">Run Agent</Button>
<Badge>3 tasks</Badge>
```

## What's included

**Components:** Accordion, AgentAvatar, Alert, AlertDialog, Avatar, Badge, Button, ButtonGroup, Card, Carousel, Collapsible, Command, ConfirmDialog, Dialog, DropdownMenu, Empty, ErrorBoundary, HoverCard, Input, InputGroup, Popover, Progress, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Sonner, Spinner, Switch, Tabs, Textarea, ToastContainer, Tooltip

**Utilities:** `cn()` (clsx + tailwind-merge), `useMobile()` hook

**Styles:** `globals.css` with design tokens, running card glow animation, typing dots, tool pulse, custom scrollbars

## Theming

Override CSS variables in `globals.css` to customize the entire design system. See the [main README](../../README.md#theming) for details.

## Peer Dependencies

- React 19+
- Tailwind CSS 4+

---

Part of [Keel & Deck](../../README.md).
