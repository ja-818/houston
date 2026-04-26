# Sales  -  Data Schema

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
      summary: string;            // short tone summary
      sampleSource: "inbox-composio" | "paste" | "social-posts";
      sampleCount: number;        // e.g. 20-30 recent sent messages
      capturedAt: string;
    };
    playbook?: {
      present: boolean;
      path: "context/sales-context.md";
      lastUpdatedAt?: string;
    };
    icp?: {
      industry: string[];
      roles: string[];
      pains: string[];
      triggers: string[];
      disqualifiers: string[];
      source: "paste" | "url" | "connected-crm";
      capturedAt: string;
    };
  };
  domains: {
    outbound?: {
      sources: ("apollo" | "linkedin" | "public-signals" | "paste" | "other")[];
      primaryChannel: "email" | "linkedin-dm" | "cold-call" | "mixed";
      cadenceWindow?: { start: string; end: string; tz: string };
      capturedAt: string;
    };
    crm?: {
      slug: "hubspot" | "salesforce" | "attio" | "pipedrive" | "close" | "other";
      dealStages: string[];        // ordered stage names
      ownerMap?: Record<string, string>;
      leadRouting?: "green-ae-yellow-sdr-red-drop" | "custom";
      capturedAt: string;
    };
    meetings?: {
      callRecorder: "gong" | "fireflies" | "other" | "none";
      meetingNotes: "googledocs" | "notion" | "paste" | "other";
      qualificationFramework: "meddpicc" | "bant" | "custom";
      primaryFirstCallGoal: string;
      capturedAt: string;
    };
    retention?: {
      billing: "stripe" | "other" | "none";
      productUsage?: "posthog" | "mixpanel" | "amplitude" | "other" | "none";
      healthThresholds?: {
        green: string;
        yellow: string;
        red: string;
      };
      renewalNoticeWindowDays: number;  // e.g. 60
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

Markdown. 3-5 verbatim samples of the user's writing plus a short
tone-notes block (greeting habits, closing habits, sentence length,
formality, quirks). Written by the first skill that drafts outreach.

---

## `context/`  -  living documents owned by this agent

### `context/sales-context.md`

The sales playbook. **Every skill reads this before it writes any
outreach, proposal, or plan.** Owned and updated exclusively by
`define-playbook`.

Structure (filled in by `define-playbook`):

- Company overview (name, site, 30s pitch, stage).
- ICP (industry, size, region, stage, anchor accounts).
- Buying committee (champion, economic buyer, blocker, influencers).
- Disqualifiers (3-5 hard nos).
- Qualification framework (MEDDPICC / BANT / custom questions).
- Pricing stance (model, bands, discount policy, non-negotiable).
- Deal stages + exit criteria.
- Objection handbook (top 5 + best-current-response).
- Top 3 competitors (strong-at / we-beat-on).
- Primary first-call goal.

Not indexed in `outputs.json`  -  it's a live document, not a
deliverable.

---

## Domain data  -  what the agent produces

Flat folders at the agent root. One `outputs.json` index at the root
spans every folder  -  there's no per-domain sub-index.

### Entity indexes (single files, not per-record)

- `leads.json`  -  flat array of lead rows touched by `find-leads` /
  `research-account` / `score`. Row includes `id`, `slug`,
  `company`, `contactName`, `email`, `source`, `fitScore`,
  `lastTouchAt`, `status`.
- `deals.json`  -  flat array of deals tracked via `prep-meeting` /
  `capture-call-notes` / `draft-proposal` / `score
  subject=deal-health`. Row includes `id`, `slug`, `company`,
  `stage`, `arr`, `closeDate`, `healthScore`, `lastCallAt`,
  `lastFollowupAt`.
- `customers.json`  -  flat array of current customers touched by
  `plan-onboarding` / `score subject=customer-health` /
  `surface-expansion` / `prep-meeting type=qbr` / `draft-outreach
  stage=renewal|churn-save`. Row includes `id`, `slug`, `company`,
  `arr`, `renewalDate`, `healthColor`, `lastQbrAt`.

### `outputs.json`  -  the single index

```ts
interface OutputRow extends BaseRecord {
  type:
    | "playbook" | "persona" | "battlecard"
    | "lead-batch" | "account-brief" | "contact-enrichment" | "warm-paths"
    | "score"
    | "outreach"
    | "call-prep" | "qbr-prep" | "call-notes" | "call-analysis"
    | "objection-reframe"
    | "proposal" | "close-plan"
    | "forecast" | "pipeline-report" | "crm-sweep" | "crm-query"
    | "routing-decision" | "task-queued"
    | "analysis"
    | "onboarding-plan" | "expansion-brief"
    | "daily-brief";
  title: string;
  summary: string;              // 2-3 sentences  -  what this doc concludes
  path: string;                 // relative to agent root
  status: "draft" | "ready";
  domain: "playbook" | "outbound" | "inbound" | "meetings" | "crm" | "retention";
}
```

Rules:

- Mark `draft` while iterating. Flip to `ready` after user sign-off.
- On update: refresh `updatedAt`, **never** touch `createdAt`.
- **Never** overwrite the whole array  -  read, merge, write.

### Artifact folders (all at agent root)

| Folder | Written by | Notes |
|---|---|---|
| `personas/{segment}.md` | `profile-icp` | Sales-flavored (buying committee). |
| `battlecards/{competitor}.md` | `build-battlecard` | Per-prospect-vs-competitor card. |
| `leads/{slug}/*.md` | `find-leads`, `research-account` | `dossier.md`, `research.md`, `warm-paths.md`, `qualify.md`. |
| `accounts/{slug}/*.md` | `research-account` (depth=full-brief) | Full cited account brief. |
| `calls/{slug}/*.md` | `capture-call-notes`, `analyze` (subject=discovery-call) | `notes-{date}.md`, `analysis-{date}.md`. |
| `deals/{slug}/*.md` | `prep-meeting`, `draft-outreach`, `draft-proposal`, `draft-close-plan` | `call-prep-{date}.md`, `followup-{date}.md`, `proposal-{date}.md`, `close-plan.md`. |
| `customers/{slug}/*.md` | `plan-onboarding`, `prep-meeting` (type=qbr), `draft-outreach` (stage=renewal|churn-save), `surface-expansion` | `onboarding-plan.md`, `qbr-{quarter}.md`, `renewal-{date}.md`, `save-{date}.md`, `expansion-{date}.md`. |
| `call-insights/{YYYY-MM-DD}.md` | `analyze` (subject=call-insights) | Cross-call synthesis. |
| `outreach/{channel}-{slug}-{date}.md` | `draft-outreach` | `channel` = `email` / `script` / `linkedin` / `inbound-reply`. |
| `briefs/{YYYY-MM-DD}.md` | `daily-brief` | Today's calendar + approvals + top-3 moves. |
| `forecasts/{YYYY-WNN}.md` | `run-forecast` | Weekly roll-up. |
| `pipeline-reports/{YYYY-WNN}.md` | `manage-crm` (action=query), `analyze` (subject=pipeline) | Pipeline readouts. |
| `analyses/{subject}-{YYYY-MM-DD}.md` | `analyze` | `subject` = `win-loss` / `sales-health` / `pipeline` / `discovery-call` / `call-insights`. |
| `scores/{subject}-{YYYY-MM-DD}.md` | `score` | `subject` = `lead` / `icp-fit` / `deal-health` / `customer-health`. |
| `crm-reports/{action}-{YYYY-MM-DD}.md` | `manage-crm` | `action` = `clean` / `query` / `route`. |
| `tasks/{YYYY-MM-DD}.md` | `manage-crm` (action=queue-followup) | Task-queue log. |

---

## No cross-agent reads

This agent is self-contained. Unlike the 5-agent `founder-sales-
workspace` sibling, there are no `../{other-agent}/...` paths
anywhere in this agent's skills. Everything lives under this folder.
