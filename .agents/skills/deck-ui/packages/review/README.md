# @deck-ui/review

Code review and deliverables UI. Split-pane review interface with sidebar navigation, detail views, and deliverable acceptance workflow.

## Install

```bash
pnpm add @deck-ui/review
```

## Usage

```tsx
import { ReviewSplit } from "@deck-ui/review"

<ReviewSplit
  items={reviewItems}
  selectedId={selectedId}
  onSelect={setSelectedId}
  onApprove={(id) => approveDeliverable(id)}
  onReject={(id) => rejectDeliverable(id)}
/>
```

## Exports

- `ReviewSplit` -- master-detail split layout for review workflow
- `ReviewSidebar` -- navigable list of review items
- `ReviewDetailPanel` -- slide-in detail panel
- `ReviewDetail` -- full review content with markdown rendering
- `ReviewItem` -- single review item in the sidebar
- `ReviewEmpty` -- empty state placeholder
- `DeliverableCard` -- deliverable with accept/reject actions
- `UserFeedback` -- user feedback display component
- Types: `ReviewItemData`, `RunStatus`

## Peer Dependencies

- React 19+
- @deck-ui/core

---

Part of [Keel & Deck](../../README.md).
