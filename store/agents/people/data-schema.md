# People  -  Data Schema

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
at runtime, written by the first skill that needs it.

### `config/context-ledger.json`

Single living file that every skill reads first.

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
      sampleSource: "inbox-composio" | "paste";
      sampleCount: number;
      capturedAt: string;
    };
    positioning?: {
      present: boolean;
      path: "context/people-context.md";
      lastUpdatedAt?: string;
    };
    idealCustomer?: {
      // Usually unused for HR. Kept for parity with other verticals.
      industry?: string[];
      roles?: string[];
      pains?: string[];
      triggers?: string[];
      source?: "paste" | "url" | "connected-crm";
      capturedAt?: string;
    };
  };
  domains: {
    people?: {
      hrPlatform?: "gusto" | "deel" | "rippling" | "justworks" | "other";
      ats?: "ashby" | "greenhouse" | "lever" | "workable" | "other";
      chat?: "slack" | "discord" | "other";
      roster?: { name: string; role?: string; level?: string; slug: string }[];
      reqs?: { slug: string; title: string; level?: string; opened?: string }[];
      reviewRhythm?: {
        cadence: "annual" | "semi-annual" | "quarterly";
        nextCycle?: string;         // ISO date
      };
      checkinRhythm?: {
        cadence: "weekly" | "biweekly";
        day?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
        time?: string;              // "HH:MM"
      };
      reviewSources?: ("glassdoor" | "anonymous-feedback" | "survey" | "other")[];
      levels?: {
        path: string;               // "leveling-drafts/{YYYY-MM-DD}.md" or inline in context doc
        lastUpdatedAt: string;
      };
      handbookSource?: {
        kind: "notion" | "googledocs" | "googlesheets" | "paste" | "url";
        ref?: string;               // URL or doc id
        lastUpdatedAt: string;
      };
      capturedAt: string;
    };
  };
}
```

**Capture rule.** Every skill declares which ledger fields it needs.
Before doing work, it reads the ledger; for any missing field it
asks ONE targeted question with a modality hint (Composio connection
> file drop > URL > paste), writes the field atomically, and
continues. Never asks the same field twice.

### `config/voice.md`

Markdown. 3-5 verbatim samples of the founder's writing (HR comms
specifically) plus a short tone-notes block (greeting habits,
closing habits, sentence length, formality, hard-news register).
Written by `calibrate-my-voice`; also mirrored into the voice-notes
section of `context/people-context.md`.

---

## `context/`  -  living documents owned by this agent

### `context/people-context.md`

The shared people doc. **Every skill reads this before it writes
anything substantive**  -  offer, performance improvement plan (PIP), policy reply, stay script,
retention score, review cycle. Owned exclusively by
`set-up-my-people-info`; voice-notes section is appended by
`calibrate-my-voice`.

Structure (filled in by `set-up-my-people-info`):

- Company values (4-6 with 1-line definitions).
- Team shape (headcount by function, open reqs).
- Leveling framework (IC + manager, L1-L5 default  -  name,
  expectations, scope, seniority markers, value-embodiment line per
  level).
- Comp bands (range per level, equity stance, location multipliers).
- Review-cycle rhythm.
- Policy canon (leave, benefits, expenses, remote, travel,
  equipment).
- Escalation rules (agent-answered vs founder-routed vs
  lawyer-routed  -  load-bearing).
- Voice notes (4-6 bullets + excerpts).
- Hard nos.

Not indexed in `outputs.json` as a file  -  it's a live document.
Each substantive edit is indexed as a `people-context` entry so the
dashboard shows the update trail.

---

## Domain data  -  what the agent produces

Flat folders at the agent root. One `outputs.json` index at the
root spans every folder.

### `outputs.json`  -  the single index

```ts
interface OutputRow extends BaseRecord {
  type:
    | "people-context"
    | "voice-calibration"
    | "candidate-evaluation" | "sourcing-list" | "interview-loop" | "offer"
    | "onboarding-plan" | "employee-dossier"
    | "review-cycle" | "performance-doc"
    | "policy-reply" | "compliance-update";
  title: string;
  summary: string;
  path: string;
  status: "draft" | "ready";
  domain: "hiring" | "onboarding" | "performance" | "compliance" | "culture";
  escalation?: "drafted" | "blocked-on-escalation" | "needs-lawyer" | "n/a";
}
```

Rules:

- Mark `draft` while iterating. Flip to `ready` after sign-off.
- On update: refresh `updatedAt`, **never** touch `createdAt`.
- **Never** overwrite the whole array  -  read, merge, write.

### Artifact folders (all at agent root)

| Folder | Written by | Notes |
|---|---|---|
| `reqs/{role-slug}.md` | `source-candidates` / `evaluate-a-candidate` (seeded) | Criteria rubric per open role. |
| `sourcing-lists/{role-slug}-{YYYY-MM-DD}.md` | `source-candidates` | Ranked sourcing batches. |
| `candidates/{candidate-slug}.md` | `evaluate-a-candidate` | Appended dated sections (Screen / LinkedIn Score / Interview). |
| `interview-loops/{candidate-slug}.md` | `prep-an-interviewer` / `coordinate-an-interview-loop` | Brief + schedule + debrief. |
| `interview-loops/{candidate-slug}-debrief.md` | `debrief-an-interview-loop` | Hire / no-hire memo. |
| `offers/{candidate-slug}.md` | `draft-a-people-document` (type=offer-letter) | Always `status: "draft"`. |
| `onboarding-plans/{employee-slug}.md` | `draft-a-people-document` (type=onboarding-plan) | Day 0 / Week 1 / 30-60-90 + welcome Slack + welcome email. |
| `employee-dossiers/{employee-slug}.md` | `profile-an-employee` | Aggregated profile. |
| `review-cycles/{cycle-slug}.md` | `prep-the-review-cycle` | Templates + timeline. |
| `performance-docs/pip-{employee-slug}.md` | `draft-a-people-document` (type=pip) | Draft only; may be an escalation note if the check fires. |
| `performance-docs/stay-conversation-{employee-slug}.md` | `draft-a-people-document` (type=stay-conversation) | Verbal script, not email. |
| `compliance-calendar.md` | `track-compliance-deadlines` | Living doc at agent root. |
| `leveling-drafts/{YYYY-MM-DD}.md` | `set-up-my-people-info` (leveling branch) | Optional draft file if the founder wants a standalone leveling artifact. |

---

## No cross-agent reads

This agent is self-contained. Unlike the 4-agent `hr-workspace`
sibling, there are no `../{other-agent}/...` paths anywhere in this
agent's skills. Everything lives under this folder.
