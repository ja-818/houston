# Engineering — Data Schema

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
    product?: {
      summary: string;            // what it is, who uses it
      source: "paste" | "url" | "connected-repo";
      capturedAt: string;
    };
    engineeringContext?: {
      present: boolean;
      path: "context/engineering-context.md";
      lastUpdatedAt?: string;
    };
    priorities?: {
      top3: string[];             // top 3 priorities this quarter
      quarter: string;            // e.g. "Q2-2026"
      capturedAt: string;
    };
  };
  domains: {
    planning?: {
      tracker: "linear" | "jira" | "github-issues" | "clickup" | "asana" | "notion" | "other";
      cadence: "weekly" | "2-week" | "monthly" | "continuous";
      capturedAt: string;
    };
    triage?: {
      severityRules?: {           // inline or path to config/severity-rules.md
        p0: string;
        p1: string;
        p2: string;
        p3: string;
      };
      capturedAt: string;
    };
    development?: {
      stack: {
        languages: string[];      // e.g. ["TypeScript", "Python"]
        frameworks: string[];     // e.g. ["Next.js", "FastAPI"]
        databases: string[];      // e.g. ["Postgres", "Redis"]
      };
      sensitiveAreas: string[];   // e.g. ["auth", "payments", "migrations"]
      reviewVoice: "direct" | "suggesting" | "asking" | "combo";
      qualityBar: {
        testCoverage?: string;    // e.g. "80% unit + integration on PRs"
        requiredChecks: string[]; // e.g. ["lint", "type-check", "tests"]
      };
      capturedAt: string;
    };
    reliability?: {
      cicd: {
        provider: "github-actions" | "gitlab-ci" | "circleci" | "buildkite" | "jenkins" | "other";
        deployTargets: string[];  // e.g. ["vercel", "fly.io"]
      };
      observability: {
        errors?: "sentry" | "bugsnag" | "rollbar" | "other";
        metrics?: "datadog" | "newrelic" | "honeycomb" | "posthog" | "other";
        logs?: "datadog" | "cloudwatch" | "grafana-loki" | "other";
      };
      onCall: "founder-only" | "rotation" | "none";
      capturedAt: string;
    };
    docs?: {
      docsHome: "mintlify" | "docusaurus" | "gitbook" | "notion" | "confluence" | "readme-only" | "other";
      audience: "developers" | "end-users" | "mixed";
      changelogFormat: "keep-a-changelog" | "conventional" | "prose" | "other";
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

---

## `context/` — living documents owned by this agent

### `context/engineering-context.md`

The shared engineering context doc. **Every skill reads this before
substantive work.** Owned and updated exclusively by
`define-engineering-context`.

Structure (filled in by `define-engineering-context`, ~300-500
words):

1. Product — what the product is, who uses it.
2. Stack — languages, frameworks, DB, infra, CI/CD, observability.
3. Architecture — shape (monolith / microservices / serverless /
   mobile / hybrid), boundaries, invariants.
4. Quality bar — test coverage, PR review rules, deploy cadence,
   release gating.
5. Team shape — people, timezones, on-call (usually just founder).
6. Current priorities — top 3 things this quarter.
7. Conventions — commit format, branch naming, PR description
   template, sensitive areas.

Not indexed in `outputs.json` — it's a live document, not a
deliverable.

### `tech-debt.md`

Single living file at the agent root. Maintained by
`triage-tech-debt` (read-merge-write, never overwrite). Entries:
`{ area, problem, impact (1-5), effort (S/M/L/XL), suggestedNext }`,
sorted impact ÷ effort (highest value first).

### `onboarding-guide.md`

Single running file at the agent root (First day / First week /
First month). Maintained by `write-docs` when `type=onboarding-guide`.

---

## Domain data — what the agent produces

Flat folders at the agent root. One `outputs.json` index at the
root spans every folder — there's no per-domain sub-index.

### `outputs.json` — the single index

```ts
interface OutputRow extends BaseRecord {
  type:
    | "roadmap" | "feature-fit" | "inbound-triage" | "release-plan"
    | "review" | "competitor" | "sprint-plan" | "bug-triage"
    | "backlog-grooming" | "priority-score" | "standup"
    | "pr-review" | "design-doc" | "adr" | "tech-debt"
    | "audit" | "pr-velocity"
    | "incident" | "postmortem" | "runbook" | "deploy-readiness"
    | "api-doc" | "tutorial" | "onboarding-guide"
    | "release-notes" | "changelog"
    | "analysis";
  title: string;
  summary: string;              // 2-3 sentences — what this doc concludes
  path: string;                 // relative to agent root
  status: "draft" | "ready";
  domain: "planning" | "triage" | "development" | "reliability" | "docs";
}
```

Rules:

- Mark `draft` while iterating. Flip to `ready` after user sign-off.
- On update: refresh `updatedAt`, **never** touch `createdAt`.
- **Never** overwrite the whole array — read, merge, write.

### Artifact folders (all at agent root)

| Folder | Written by | Notes |
|---|---|---|
| `roadmaps/{quarter}.md` | `plan-roadmap` | Quarterly roadmap. |
| `feature-fit/{slug}.md` | `validate-feature-fit` | Market-fit verdict. |
| `inbound-triage/{slug}.md` | `triage-inbound-request` | Routing verdict. |
| `release-plans/{feature-slug}.md` | `coordinate-release` | Per-phase checklist. |
| `reviews/{YYYY-MM-DD}.md` | `analyze` (subject=engineering-health) | Monday brief. |
| `competitor-watch/{slug}.md` or `weekly-{YYYY-MM-DD}.md` | `analyze` (subject=competitors) | Teardown or digest. |
| `sprints/{YYYY-WNN}.md` | `plan-sprint` | Sprint plan. |
| `bug-triage/{slug}.md` | `triage-bug-report` | Structured ticket draft. |
| `backlog-grooming/{YYYY-MM-DD}.md` | `groom-backlog` | Three lists. |
| `priority-scores/{slug}.md` | `score-ticket-priority` | RICE or MoSCoW table. |
| `standups/{YYYY-MM-DD}.md` | `run-standup` | Yesterday / Today / Blockers. |
| `pr-reviews/{pr-slug}.md` | `review-pr` | Risk-ordered review. |
| `design-docs/{feature-slug}.md` | `draft-design-doc` | Full RFC. |
| `adrs/{YYYY-MM-DD}-{slug}.md` | `write-adr` | Michael Nygard ADR. |
| `audits/{surface}-{slug}-{YYYY-MM-DD}.md` | `audit` | `surface` ∈ architecture / ci-cd / observability / devx / readme. |
| `pr-velocity/{YYYY-Www}.md` | `analyze` (subject=pr-velocity) | DORA-lite readout. |
| `incidents/{id}.md` | `run-incident-response` | Incident timeline. |
| `postmortems/{id}.md` | `write-postmortem` | Blameless postmortem. |
| `runbooks/{slug}.md` | `draft-runbook` | Command-first ops doc. |
| `deploy-readiness/{release-slug}.md` | `review-deploy-readiness` | GO / NO-GO / SOFT-GO verdict. |
| `api-docs/{endpoint-slug}.md` | `write-docs` (type=api) | Stripe-grade per-endpoint doc. |
| `tutorials/{slug}.md` | `write-docs` (type=tutorial) | Diátaxis tutorial. |
| `release-notes/{version}.md` | `write-release-notes` (format=release-notes) | Keep-A-Changelog release notes. |
| `changelog/{version}.md` | `write-release-notes` (format=changelog) | CHANGELOG snippet. |
| `analyses/{subject}-{YYYY-MM-DD}.md` | `analyze` | Generic analysis artifacts. |

---

## No cross-agent reads

This agent is self-contained. Unlike the 5-agent `engineering-
workspace` sibling, there are no `../{other-agent}/...` paths
anywhere in this agent's skills. Everything lives under this
folder.
