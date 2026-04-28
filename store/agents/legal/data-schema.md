# Legal  -  Data Schema

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
`.houston/<agent-path>/`**  -  the Houston file watcher skips that
prefix and dashboard reactivity breaks.

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
    entity?: {
      state: "DE" | "CA" | "WA" | "other";     // jurisdiction of formation
      type: "c-corp" | "llc" | "s-corp" | "other";
      formationDate?: string;                   // ISO date
      authorizedShares?: number;
      parValue?: number;                        // typical 0.00001
      issuedShares?: number;
      grossAssets?: number;                     // for DE recalc
      directors?: string[];
      officers?: string[];
      four09aDate?: string;                     // last 409A date
      source: "paste" | "file" | "connected-cap-table";
      capturedAt: string;
    };
    posture?: {
      risk: "lean" | "balanced" | "conservative";
      escalationThreshold?: string;             // e.g. "> $50k TCV or IP claim"
      capturedAt: string;
    };
    legalContext?: {
      present: boolean;
      path: "context/legal-context.md";
      lastUpdatedAt?: string;
    };
  };
  domains: {
    contracts?: {
      templateLibrary?: string;                 // path or URL
      counterpartyStack?: string[];             // e.g. ["Vercel","Stripe","Notion"]
      signingPlatform?: "docusign" | "pandadoc" | "hellosign" | "other";
      documentStorage?: "googledrive" | "dropbox" | "notion" | "other";
      capturedAt: string;
    };
    compliance?: {
      landingPageUrl?: string;
      dataGeography: "us-only" | "eu-inclusive" | "global";
      analyticsStack?: string[];                // e.g. ["posthog","ga4"]
      deployedPolicies?: {
        privacyPolicyUrl?: string;
        tosUrl?: string;
        cookiePolicyUrl?: string;
      };
      capturedAt: string;
    };
    entity?: {
      // optional operational fields beyond universal.entity
      boardConsentsPath?: string;
      annualFilings?: string[];                 // history of filings prepped
      capturedAt: string;
    };
    ip?: {
      marks?: { mark: string; status: "searched" | "filed" | "registered"; niceClasses: number[] }[];
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

## `context/`  -  living documents owned by this agent

### `context/legal-context.md`

The shared legal doc. **Every skill reads this before it writes
any substantive artifact.** Owned and updated exclusively by
`set-up-my-legal-info`.

Structure (filled in by `set-up-my-legal-info`):

- Entity snapshot (state, type, formation date, authorized shares,
  issued shares, par value, 409A date).
- Cap table snapshot (founders, investors, option pool, fully
  diluted totals).
- Standing agreements (customer MSA, vendor DPA, cloud, auditors).
- Template stack (NDAs, consulting, offer letter, MSA, order form,
  board consent).
- Open risks (IP assignments pending, advisor agreements missing,
  83(b) elections filed / pending, DPA gaps).
- Founder risk posture + escalation rules.
- Top standing advisors / outside counsel type (no specific firms).

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
    | "legal-context" | "contract-review" | "clause-extract"
    | "nda-review" | "redline-plan" | "advice-memo"
    | "escalation-brief" | "draft"
    | "privacy-policy" | "tos-draft" | "cookie-policy"
    | "privacy-audit" | "subprocessor-review" | "template-review"
    | "security-questionnaire" | "signature-status"
    | "counterparty-log" | "deadline-summary" | "weekly-review"
    | "annual-filing" | "tm-search" | "offer-packet"
    | "dsr-response" | "intake-summary";
  title: string;
  summary: string;              // 2-3 sentences  -  what this doc concludes
  path: string;                 // relative to agent root
  status: "draft" | "ready" | "filed" | "executed";
  domain: "contracts" | "compliance" | "entity" | "ip" | "advisory";
  attorneyReviewRequired?: boolean;
}
```

Rules:

- Mark `draft` while iterating. Flip to `ready` after founder
  sign-off. `filed` / `executed` reserved for post-submission
  artifacts (Delaware filing receipt, executed counterparty copy).
- On update: refresh `updatedAt`, **never** touch `createdAt`.
- **Never** overwrite the whole array  -  read, merge, write.

### Living state files at the agent root

| File | Written by | Notes |
|---|---|---|
| `counterparty-tracker.json` | `track-deadlines-and-signatures` (counterparties) | Executed agreements (id, counterparty, type, executedDate, term, auto-renewal, notice period, governing law, signedCopyPath). |
| `subprocessor-inventory.json` | `audit-compliance` (subprocessors) | Vendor inventory (role, data categories, transfer mechanism, DPA status, public DPA URL). |
| `deadline-calendar.json` | `track-deadlines-and-signatures` (deadlines) | Canonical legal calendar (Delaware March 1, 83(b) 30-day, 409A 12-month, DSR 30/45-day, TM office action, annual board consent). |

### Artifact folders (all at agent root)

| Folder | Written by | Notes |
|---|---|---|
| `contract-reviews/{counterparty}-{YYYY-MM-DD}.md` | `review-a-contract` (mode=full) | |
| `clause-extracts/{counterparty}-{YYYY-MM-DD}.md` | `review-a-contract` (mode=clauses-only) | |
| `ndas/{counterparty}-{YYYY-MM-DD}.md` | `review-a-contract` (mode=nda-traffic-light) | |
| `redline-plans/{counterparty}-{YYYY-MM-DD}.md` | `plan-contract-pushback` | |
| `advice-memos/{topic-slug}-{YYYY-MM-DD}.md` | `answer-a-legal-question` | |
| `escalations/{matter-slug}-{YYYY-MM-DD}.md` | `draft-a-legal-document` (type=escalation-brief) | |
| `drafts/{type}/{counterparty}-{YYYY-MM-DD}.md` | `draft-a-legal-document` (type ∈ nda / consulting / offer-letter / msa / order-form / board-consent) | |
| `privacy-drafts/privacy-policy-{YYYY-MM-DD}.md` | `draft-a-legal-document` (type=privacy-policy) | |
| `privacy-drafts/tos-{YYYY-MM-DD}.md` | `draft-a-legal-document` (type=tos) | |
| `privacy-audits/{YYYY-MM-DD}.md` | `audit-compliance` (scope=privacy-posture) | |
| `subprocessor-reviews/{YYYY-MM-DD}.md` | `audit-compliance` (scope=subprocessors) | + updates `subprocessor-inventory.json` |
| `template-reviews/{YYYY-MM-DD}.md` | `audit-compliance` (scope=template-library) | |
| `security-questionnaires/{prospect-slug}-{YYYY-MM-DD}.md` | `security-questionnaire` | |
| `signature-status/{YYYY-MM-DD}.md` | `track-deadlines-and-signatures` (scope=signatures) | |
| `deadline-summaries/{YYYY-MM-DD}.md` | `track-deadlines-and-signatures` (scope=deadlines) | + updates `deadline-calendar.json` |
| `weekly-reviews/{YYYY-MM-DD}.md` | `track-deadlines-and-signatures` (scope=weekly-review) | |
| `intake-summaries/{YYYY-MM-DD}.md` | `sort-my-legal-inbox` | |
| `annual-filings/{YYYY}-delaware.md` | `prepare-the-delaware-annual-filing` | |
| `tm-searches/{mark-slug}-{YYYY-MM-DD}.md` | `check-a-trademark` | |
| `offer-packets/{candidate-slug}-{YYYY-MM-DD}/` | `prepare-a-job-offer` | 4 files: offer letter, CIIAA, option grant notice, exercise agreement + index. |
| `dsr-responses/{request-id}-{YYYY-MM-DD}/` | `draft-a-legal-document` (type=dsr-response) | 3 files: acknowledgment, identity verification, export cover note. |

---

## No cross-agent reads

This agent is self-contained. Unlike the 3-agent `legal-workspace`
sibling, there are no `../{other-agent}/...` paths anywhere in this
agent's skills. Everything lives under this folder.
