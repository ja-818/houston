# Operations — Data Schema

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
`.houston/<agent-path>/`** — the Houston file watcher
(`crates/houston-tauri/src/agent_watcher.rs`) skips that prefix and
dashboard reactivity breaks.

---

## `config/` — the context ledger

Nothing under `config/` is shipped in the repo. Every field appears
at runtime, written by the first skill that needs it. This is
"what I've learned about the user" — not "what I've produced for
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
      summary: string;            // short tone summary
      sampleSource: "inbox-composio" | "paste" | "social-posts";
      sampleCount: number;        // e.g. 20-30 recent sent messages
      capturedAt: string;
    };
    positioning?: {
      present: boolean;
      path: "context/operations-context.md";
      lastUpdatedAt?: string;
    };
    icp?: {
      industry: string[];
      roles: string[];
      capturedAt: string;
    };
  };
  domains: {
    rhythm?: {
      timezone: string;           // IANA, e.g. "America/New_York"
      deepWorkDays: string[];     // e.g. ["Mon","Wed"]
      meetingDays: string[];
      maxMeetingsPerDay: number;
      focusBlocks?: { day: string; start: string; end: string }[];
      briefDeliveryTime: string;  // local HH:mm
      capturedAt: string;
    };
    people?: {
      vips: { name: string; relation: string; notes?: string }[];
      keyContacts: { name: string; role: string; how: string }[];
      capturedAt: string;
    };
    data?: {
      warehouse: "postgres" | "bigquery" | "snowflake" | "redshift" | "other";
      metricsRegistryPath: "config/metrics.json";
      schemasPath: "config/schemas.json";
      experimentPlatform?: "posthog" | "mixpanel" | "optimizely" | "in-house" | "other";
      capturedAt: string;
    };
    vendors?: {
      riskAppetite: "conservative" | "balanced" | "fast";
      signatureAuthority: "founder-only" | "any-exec";
      termPreference: "monthly" | "annual" | "case-by-case";
      paperPreference: "ours" | "theirs" | "whatever";
      capturedAt: string;
    };
    investors?: {
      cadence: "monthly" | "quarterly" | "both";
      list: { name: string; email?: string }[];
      format: "email" | "gdoc" | "notion" | "other";
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

### Other `config/` files

- `config/voice.md` — 3-5 verbatim samples + tone notes. Written
  the first time a drafting skill runs.
- `config/metrics.json` — metric registry. Written/updated by
  `track-metric`.
- `config/schemas.json` — table schemas + freshness expectations.
  Lazy-introspected by `run-sql-query` / `analyze subject=data-qa`.
- `config/dashboards.json` — dashboard specs. Written by
  `spec-dashboard`.

---

## `context/` — living documents owned by this agent

### `context/operations-context.md`

The operating doc. **Every skill reads this before it writes any
substantive artifact.** Owned and updated exclusively by
`define-operating-context`.

Structure (filled in by `define-operating-context`):

- Company overview (name, site, 30s pitch, stage, why now).
- Active priorities (2-3 things this quarter).
- Operating rhythm (deep-work / meeting / review cadence, timezone).
- Key contacts (investors, advisors, anchor customers, contractors).
- Tools & systems (Composio categories + where data lives).
- Vendors & spend posture.
- Hard nos (workspace-level four + founder-specific).
- Communication voice (4-6 bullets from `config/voice.md`).

Not indexed in `outputs.json` — it's a live document, not a
deliverable.

---

## Domain data — what the agent produces

Flat folders at the agent root. One `outputs.json` index at the
root spans every folder — there's no per-domain sub-index.

### `outputs.json` — the single index

```ts
interface OutputRow extends BaseRecord {
  type:
    | "brief" | "meeting-prep" | "meeting-notes"
    | "triage" | "calendar-scan"
    | "reply-draft" | "followup-log" | "followup-draft" | "vendor-draft"
    | "signal" | "update-roundup" | "approval-decision"
    | "decision" | "bottleneck" | "okr-snapshot"
    | "weekly-review" | "metrics-rollup"
    | "board-pack" | "investor-update"
    | "travel-plan" | "schedule-proposal"
    | "saas-audit" | "contract-extract" | "renewal-digest"
    | "supplier-evaluation" | "compliance-report"
    | "experiment-readout" | "anomaly-sweep" | "data-qa-report"
    | "metric-definition" | "sql-result" | "dashboard-spec";
  title: string;
  summary: string;              // 2-3 sentences — what this doc concludes
  path: string;                 // relative to agent root
  status: "draft" | "ready";
  domain: "planning" | "scheduling" | "finance" | "vendors" | "data";
}
```

Rules:

- Mark `draft` while iterating. Flip to `ready` after user sign-off.
- On update: refresh `updatedAt`, **never** touch `createdAt`.
- **Never** overwrite the whole array — read, merge, write.

### Flat JSON indexes at agent root

- `decisions.json` — one row per logged decision with pointer to
  `decisions/{slug}/decision.md`.
- `bottlenecks.json` — named bottlenecks + hypothesis + owner +
  status.
- `okr-history.json` — OKR snapshots over time.
- `metrics-daily.json` — daily metric snapshots.
- `anomalies.json` — open + resolved anomaly records.
- `followups.json` — commitment ledger (who / what / by when /
  status).
- `calendar-conflicts.json` — active calendar conflicts.

### Artifact folders (all at agent root)

| Folder | Written by | Notes |
|---|---|---|
| `briefs/{YYYY-MM-DD}.md` | `brief` (mode=daily) | Plus `-dump.md` for brain-dump sub-mode. |
| `meetings/{YYYY-MM-DD}-{slug}-pre.md` | `brief` (mode=meeting-pre) | Deep attendee pre-read. |
| `meetings/{YYYY-MM-DD}-{slug}-post.md` | `brief` (mode=meeting-post) | Decisions + owners + follow-ups. |
| `triage/{YYYY-MM-DD}.md` | `triage` (surface=inbox) | `-HH` suffix for second pass same day. |
| `calendar-scans/{YYYY-MM-DD}.md` | `triage` (surface=calendar) | Upserts `calendar-conflicts.json`. |
| `drafts/reply-{YYYY-MM-DD}-{slug}.md` | `draft-message` (type=reply) | Also saves inbox draft via Composio. |
| `drafts/followup-{YYYY-MM-DD}-{slug}.md` | `draft-message` (type=followup, HANDLE) | |
| `drafts/vendor-{sub-type}-{vendor-slug}.md` | `draft-message` (type=vendor) | `sub-type` ∈ renewal / cancel / trial / reference-check. |
| `signals/{slug}-{YYYY-MM-DD}.md` | `synthesize-signal` | Cited briefs. |
| `updates/{YYYY-MM-DD}.md` | `collect-updates` | Team update roundup. |
| `reviews/{YYYY-MM-DD}.md` | `run-review` (period=weekly) | Monday review. |
| `rollups/{YYYY-MM-DD}.md` | `run-review` (period=metrics-rollup) | Cross-metric WoW. |
| `approvals/{kind}-{slug}.md` | `run-approval-flow` | Rubric-scored. |
| `decisions/{slug}/decision.md` | `log-decision` | Plus `decisions.json` row. |
| `bottlenecks/{slug}.md` | `identify-bottleneck` | Plus `bottlenecks.json` row. |
| `okrs/{yyyy-qq}.md` | `track-okr` | Plus `okr-history.json` snapshot. |
| `board-packs/{yyyy-qq}/board-pack.md` | `prep-package` (type=board-pack) | Optional Google Doc mirror. |
| `investor-updates/{yyyy-qq}/update.md` | `prep-package` (type=investor-update) | Optional Google Doc mirror. |
| `meetings/{slug}-proposal.md` | `schedule-meeting` | Scheduling proposal + outreach draft. |
| `trips/{slug}/` | `coordinate-travel` | Summary + itinerary + packing list. |
| `saas-audits/{YYYY-MM-DD}.md` | `audit-saas-spend` | |
| `contracts/{vendor-slug}/` | source of truth for contracts + `extract-contract-clauses` writes extract.md. | |
| `renewals/calendar.md` + `renewals/{yyyy-qq}.md` | `track-renewals` | Living + quarterly digest. |
| `evaluations/{supplier-slug}.md` | `evaluate-supplier` | |
| `compliance-reports/{company-slug}.md` | `research-compliance` | |
| `analyses/experiment-{slug}-{YYYY-MM-DD}.md` | `analyze` (subject=experiment) | |
| `analyses/anomaly-sweep-{YYYY-MM-DD}.md` | `analyze` (subject=anomaly) | Plus `anomalies.json` upsert. |
| `data-quality-reports/{YYYY-MM-DD}/report.md` | `analyze` (subject=data-qa) | |
| `queries/{slug}/query.sql` + `result-latest.csv` | `run-sql-query` | Saved for reuse. |

---

## No cross-agent reads

This agent is self-contained. Unlike the 5-agent `operations-
workspace` sibling, there are no `../{other-agent}/...` paths
anywhere in this agent's skills. Everything lives under this
folder.
