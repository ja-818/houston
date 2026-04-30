# Support  -  Data Schema

All records share these base fields:

```ts
interface BaseRecord {
  id: string;          // UUID v4
  createdAt: string;   // ISO-8601 UTC
  updatedAt: string;   // ISO-8601 UTC
}
```

All writes are atomic: write `*.tmp`, then rename onto the target
path. Never edit in-place. **Never write anywhere under
`.houston/<agent-path>/`**  -  the Houston file watcher
(`crates/houston-tauri/src/agent_watcher.rs`) skips that prefix and
dashboard reactivity breaks.

---

## `config/`  -  the context ledger

Nothing under `config/` is shipped in the repo. Every field appears
at runtime, written by the first skill that needs it. This is
"what I've learned about the user"  -  not "what I've produced for
them."

### `config/context-ledger.json`

Single living file that every skill reads first. Shape:

```ts
interface ContextLedger {
  universal: {
    company?: {
      name: string;
      website?: string;
      pitch30s?: string;
      stage?: "idea" | "mvp" | "early" | "growth" | "scale";
      source: "paste" | "url" | "file" | "connected-app";
      capturedAt: string;
    };
    voice?: {
      summary: string;
      sampleSource: "inbox-composio" | "paste" | "helpdesk";
      sampleCount: number;
      capturedAt: string;
    };
    positioning?: {
      present: boolean;
      path: "context/support-context.md";
      lastUpdatedAt?: string;
    };
    icp?: {
      industry: string[];
      roles: string[];
      pains: string[];
      planTiers: string[];
      source: "paste" | "url" | "connected-crm";
      capturedAt: string;
    };
  };
  domains: {
    inbox?: {
      channels: ("gmail" | "outlook" | "intercom" | "help_scout" | "zendesk" | "slack" | "other")[];
      slaTargets: {
        firstResponseHours?: number;
        resolutionHours?: number;
      };
      routingCategories: string[]; // e.g. ["bug", "feature-request", "how-to", "billing", "churn", "spam"]
      capturedAt: string;
    };
    "help-center"?: {
      platform: "notion" | "intercom" | "help_scout" | "googledocs" | "paste" | "other";
      primaryAudience: string;
      toneProfile: string;
      capturedAt: string;
    };
    success?: {
      planTiers: string[];
      renewalCadence: "monthly" | "annual" | "mixed";
      qbrSegment?: string;
      churnSignals: string[];
      capturedAt: string;
    };
    quality?: {
      escalationTiers: ("P0" | "P1" | "P2" | "P3")[];
      severityDefinitions?: Record<string, string>;
      reviewCadence: "weekly" | "biweekly" | "monthly";
      capturedAt: string;
    };
  };
}
```

**Capture rule.** Every skill declares in its body which ledger
fields it needs. Before doing work, it reads the ledger; for any
missing field it asks ONE targeted question with a modality hint,
writes the field atomically, and continues. Never asks the same
field twice.

### `config/voice.md`

Markdown. 3-5 verbatim samples of the user's outbound support
writing plus a short tone-notes block (greeting habits, closing
habits, sentence length, formality, apology style, quirks).
Written by `calibrate-my-voice` and by the first skill that drafts
a reply.

---

## `context/`  -  living documents owned by this agent

### `context/support-context.md`

The support positioning doc. **Every skill reads this before it
writes a reply, article, or campaign.** Owned and updated
exclusively by `set-up-my-support-info` (routing section also
updated by `tune-my-routing`).

Structure (filled in by `set-up-my-support-info`):

- Company overview (name, site, 30s pitch, stage).
- Product surface (what we support / what we don't).
- Support channels and SLA targets.
- Voice & tone principles.
- Routing rules (bug / feature-request / how-to / billing / churn /
  spam  -  with concrete examples per category).
- Escalation tiers and severity definitions.
- Known pains / recurring ask patterns.
- Plan-tier map (who gets what level of support).

Not indexed in `outputs.json`  -  it's a live document, not a
deliverable.

---

## Domain data  -  what the agent produces

Flat folders at the agent root. One `outputs.json` index at the
root spans every folder  -  there's no per-domain sub-index.

### `outputs.json`  -  the single index

```ts
interface OutputRow extends BaseRecord {
  type:
    | "support-context" | "routing-rules" | "escalation-playbook"
    | "voc-synthesis" | "voice-calibration"
    | "conversation" | "triage" | "thread-summary" | "reply-draft"
    | "dossier" | "timeline" | "health-score" | "churn-risk"
    | "morning-brief" | "sla-report" | "stale-rescue"
    | "bug-candidate" | "feature-request" | "repeat-question"
    | "promise"
    | "kb-article" | "known-issue" | "broadcast" | "article-refresh"
    | "docs-gap"
    | "onboarding-sequence" | "renewal-outreach" | "expansion-nudge" | "churn-save"
    | "qbr" | "weekly-review" | "help-center-digest";
  title: string;
  summary: string;
  path: string;
  status: "draft" | "ready" | "sent";
  domain: "inbox" | "help-center" | "success" | "quality";
}
```

Rules:

- Mark `draft` while iterating. Flip to `ready` after user sign-off.
  Flip to `sent` once the user tells me they sent it.
- On update: refresh `updatedAt`, **never** touch `createdAt`.
- **Never** overwrite the whole array  -  read, merge, write.

### Index files (all at agent root)

| File | Written by | Notes |
|---|---|---|
| `conversations.json` | `triage-a-ticket` | Flat index of every ticket with routing category, priority, assignee, lastActivity. |
| `customers.json` | `triage-a-ticket` + `look-up-a-customer` | Customer records with plan, MRR, slug. |
| `health-scores.json` | `look-up-a-customer` (view=health) | GREEN / YELLOW / RED with 3 signals + reasoning. |
| `churn-flags.json` | `look-up-a-customer` (view=churn-risk) + `flag-a-signal` | Open flags per customer with signal + recommended action. |
| `followups.json` | `track-my-promises` | Open commitments with due dates. |
| `bug-candidates.json` | `flag-a-signal` (signal=bug) | Repro steps + source conversation id. |
| `requests.json` | `flag-a-signal` (signal=feature-request) | Feature asks with requesting customer slugs + counts. |
| `patterns.json` | `flag-a-signal` (signal=repeat-question) | Repeating question clusters (≥3 hits). |
| `known-issues.json` | `write-an-article` (type=known-issue) | Public status entries (article id + incident id). |

### Artifact folders (all at agent root)

| Folder | Written by | Notes |
|---|---|---|
| `conversations/{id}/thread.json + draft.md + notes.md` | `triage-a-ticket`, `draft-a-reply`, `catch-me-up-on-a-thread` | Per-conversation working dir. |
| `dossiers/{slug}.md` | `look-up-a-customer` (view=dossier) | |
| `timelines/{slug}.md` | `look-up-a-customer` (view=timeline) | |
| `briefings/{YYYY-MM-DD}.md` | `check-my-inbox` (scope=morning-brief) | |
| `sla-reports/{YYYY-MM-DD}.md` | `check-my-inbox` (scope=sla-breach) | |
| `stale-rescues/{YYYY-MM-DD}.md` | `check-my-inbox` (scope=stale-threads) | |
| `articles/{slug}.md` | `write-an-article` (type=from-ticket, refresh-stale) | Also mirrored to connected Notion / Intercom KB / Google Docs if connected. |
| `known-issues/{slug}.md` | `write-an-article` (type=known-issue) | Customer-facing status page. |
| `broadcasts/{YYYY-MM-DD}-{slug}.md` | `write-an-article` (type=broadcast-shipped) | "You asked, we shipped" notes. |
| `gaps/{YYYY-MM-DD}.md` | `find-my-docs-gaps` | Ranked docs gaps with source tickets. |
| `onboarding/{segment}.md` | `draft-a-lifecycle-message` (type=welcome-series) | |
| `renewals/{account}-{YYYY-MM-DD}.md` | `draft-a-lifecycle-message` (type=renewal) | Day-90 / Day-60 / Day-30 sequence. |
| `expansions/{account}.md` | `draft-a-lifecycle-message` (type=expansion-nudge) | |
| `saves/{account}.md` | `draft-a-lifecycle-message` (type=churn-save) | |
| `qbrs/{account}-{YYYY-MM-DD}.md` | `review-my-support` (scope=qbr) | 4-section QBR outline. |
| `playbooks/{incident-type}.md` | `draft-a-playbook` | |
| `voc/{YYYY-MM-DD}.md` | `mine-my-tickets` | Voice-of-customer synthesis. |
| `reviews/{YYYY-MM-DD}.md` | `review-my-support` (scope=weekly) | |
| `digests/{YYYY-MM-DD}.md` | `review-my-support` (scope=help-center-digest) | |

---

## No cross-agent reads

This agent is self-contained. Unlike the 4-agent `solo-support-
workspace` sibling, there are no `../{other-agent}/...` paths
anywhere in this agent's skills. Everything lives under this
folder.
