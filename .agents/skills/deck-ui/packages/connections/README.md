# @deck-ui/connections

External service connections management. Display connected services, manage OAuth tokens, handle connection status.

## Install

```bash
pnpm add @deck-ui/connections
```

## Usage

```tsx
import { ConnectionsView } from "@deck-ui/connections"

<ConnectionsView
  connections={connections}
  onConnect={(id) => startOAuth(id)}
  onDisconnect={(id) => revokeConnection(id)}
/>
```

## Exports

- `ConnectionsView` -- full connections list with status indicators
- `ConnectionRow` -- single connection with connect/disconnect actions
- Types: `Connection`, `ConnectionsResult`

## Peer Dependencies

- React 19+
- @deck-ui/core

---

Part of [Keel & Deck](../../README.md).
