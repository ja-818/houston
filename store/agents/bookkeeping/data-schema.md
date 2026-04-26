# Bookkeeping  -  Data Schema

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

## `config/`  -  the context ledger + learned facts

Nothing under `config/` is shipped in the repo. Every field appears
at runtime, written by the first skill that needs it.

### `config/context-ledger.json`

Single living file that every skill reads first. Shape:

```ts
interface ContextLedger {
  universal: {
    company?: {
      legalName: string;
      dba?: string;
      entityType: "c-corp" | "s-corp" | "llc" | "partnership" | "sole-prop";
      ein?: string;
      state: string;                     // state of incorporation
      fiscalYearEnd: string;             // "12-31" | "06-30" etc.
      foundedOn?: string;                // YYYY-MM-DD
      stage: "pre-seed" | "seed" | "series-a" | "series-b" | "growth";
      industry?: string;
      source: "paste" | "url" | "file" | "connected-app";
      capturedAt: string;
    };
    accountingMethod?: {
      method: "cash" | "accrual";
      switchedOn?: string;               // YYYY-MM-DD if switched
      capturedAt: string;
    };
    coa?: {
      present: boolean;
      path: "config/chart-of-accounts.json";
      framework: "gaap-startup" | "ifrs" | "tax-basis";
      lastUpdatedAt?: string;
    };
    openingBalances?: {
      asOf: string;                      // YYYY-MM-DD
      source: "prior-books" | "fresh-start" | "qbo-import" | "xero-import";
      trialBalancePath?: string;         // e.g. "config/opening-trial-balance.json"
      capturedAt: string;
    };
    suspenseCode?: {
      code: string;                      // GL code, stored as string
      name: string;                      // e.g. "Suspense"
      capturedAt: string;
    };
  };
  domains: {
    banks?: {
      accounts: {
        last4: string;
        type: "checking" | "savings" | "credit-card" | "payment-processor";
        bank: string;                    // "Chase", "Mercury", "SVB", "Stripe"
        glCode: string;                  // text, prefixed with ' in Sheets
        glName: string;
      }[];
      capturedAt: string;
    };
    payroll?: {
      provider: "gusto" | "rippling" | "justworks" | "deel" | "adp" | "none";
      cadence: "weekly" | "biweekly" | "semimonthly" | "monthly";
      teamSize: number;
      stockCompPosture: "iso" | "nso" | "rsu" | "mix" | "none";
      capturedAt: string;
    };
    revenue?: {
      model: "saas-subscription" | "usage" | "services" | "marketplace" | "mix";
      asc606: "standalone" | "combined" | "n/a";
      contractSource: "stripe" | "hubspot" | "spreadsheet" | "other";
      capturedAt: string;
    };
    budget?: {
      cadence: "none" | "quarterly" | "rolling";
      path?: string;                     // "config/budget.json"
      capturedAt: string;
    };
    investors?: {
      cadence: "monthly" | "quarterly" | "both";
      anchorKpis: string[];              // e.g. ["ARR","Gross Margin","Burn","Runway"]
      format: "email" | "gdoc" | "notion" | "other";
      capturedAt: string;
    };
    tax?: {
      preparerName?: string;
      preparerEmail?: string;
      lastYearFiled?: string;            // YYYY
      rdCreditEligible: "yes" | "no" | "tbd";
      stateFilingFootprint: string[];    // ["CA","DE","NY"]
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

- `config/chart-of-accounts.json`  -  the authoritative CoA. Shape:
  `[{code, name, type, parent?, statementSection, description?}]`
  where `type ∈ {"asset","liability","equity","revenue","cogs","expense"}`
  and `statementSection` groups lines on financial statements
  (e.g., `"operating-expenses.rd"`). Written by
  `build-chart-of-accounts`. **Locked at run start** for any
  categorization run.
- `config/party-rules.json`  -  user-confirmed exact-match vendor
  rules: `{canonical_party: gl_code}`. Written by user confirmation
  inside `categorize-transactions` / `process-statements`.
- `config/prior-categorizations.json`  -  rolling memory of vendor →
  GL assignments, only for categorizations with `confidence ≥ 0.95`
  or `source ∈ {rule, prior_year, transfer}`. Written atomically
  after each successful run.
- `config/budget.json`  -  optional quarterly/rolling budget rows,
  `[{period, glCode, amount, note?}]`. Consumed by
  `run-variance-analysis`.
- `config/opening-trial-balance.json`  -  opening balances at the
  start of the books: `[{glCode, debit, credit}]`. Must balance.

---

## `context/`  -  living documents owned by this agent

### `context/bookkeeping-context.md`

The bookkeeping brief. **Every skill reads this before it writes
any substantive artifact.** Owned and updated exclusively by
`define-bookkeeping-context`.

Structure (filled in by `define-bookkeeping-context`):

- Company overview (legal name, entity type, state, fiscal year,
  EIN, stage, industry).
- Accounting posture (cash vs. accrual, framework, any mid-year
  switches with date).
- Bank accounts and credit cards (grouped by `last4`; each tied
  to a GL code).
- Revenue model (subscription / usage / services; ASC 606 posture).
- Payroll posture (provider, cadence, team size, stock-comp plan).
- Compliance footprint (state-filing footprint, R&D-credit posture,
  sales-tax exposure notes).
- Investor cadence (monthly / quarterly / none, anchor KPIs).
- Tax preparer details (name, email, last year filed).
- Hard nos (what I never do without sign-off  -  e.g., "don't book
  SBC without founder approval of 409A valuation").

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
    | "run" | "categorization" | "reconciliation" | "expense-receipt"
    | "close-package" | "journal-entry" | "accrual-register" | "revrec-schedule"
    | "financial-statement" | "variance-analysis" | "burn-runway" | "investor-financials"
    | "books-audit"
    | "vendor-1099-list" | "rd-classification" | "sales-tax-nexus" | "tax-handoff";
  title: string;
  summary: string;             // 2-3 sentences  -  what this doc concludes
  path: string;                // relative to agent root
  status: "draft" | "ready" | "posted";
  domain: "setup" | "transactions" | "close" | "reporting" | "compliance";
}
```

Rules:

- Mark `draft` while iterating. Flip to `ready` after user sign-off.
  `posted` only after the user confirms the underlying JE / filing
  has been entered into QBO / Xero / the tax return.
- On update: refresh `updatedAt`, **never** touch `createdAt`.
- **Never** overwrite the whole array  -  read, merge, write.

### Flat JSON indexes at agent root

- `run-index.json`  -  every run (`process-statements` or
  `run-monthly-close`) with `{id, period, status, sheetUrl?,
  accountsIncluded[], suspenseTotal, pnlNetIncome}`.
- `journal-entries.json`  -  every drafted JE with
  `{id, date, type, memo, lines[], status, postedTo?}`.
- `accruals.json`  -  active + reversed accruals register.
- `recon-breaks.json`  -  unmatched items across reconciliations
  with aging.
- `suspense.json`  -  current suspense-balance items awaiting
  reclassification, with aging.

### Artifact folders (all at agent root)

| Folder | Written by | Notes |
|---|---|---|
| `statements/{account_last4}/{YYYY-MM}.pdf` | intake (user drop) | Source statements copied here on first sight. |
| `runs/{period}/run.json` | `process-statements` | Full run artifact + recovery source. |
| `runs/{period}/_extractions/` | Haiku extractor subagents | Transient  -  one JSON per source PDF. |
| `runs/{period}/_categorizations/` | Sonnet categorizer subagents | Transient  -  one JSON per account_last4. |
| `runs/{period}/_sheet_state/{period}.json` | Sonnet Sheets Writer subagent | Google Sheet verification state. |
| `transactions/{YYYY-MM}.md` | `categorize-transactions` | Review-ready categorized batches. |
| `reconciliations/{account_last4}/{YYYY-MM}.md` | `reconcile-account` | Unmatched-item aging + adjustment candidates. |
| `expenses/{YYYY-MM-DD}-{slug}.md` | `handle-expense-receipt` | One receipt = one file. |
| `closes/{YYYY-MM}/package.md` | `run-monthly-close` | Top-level close narrative + links to every sub-artifact. |
| `closes/{YYYY-MM}/cutoff-check.md` | `run-monthly-close` (subflow) | Unrecorded liabilities + cutoff issues. |
| `journal-entries/{YYYY-MM}/{slug}.md` | `prep-journal-entry` | Per JE  -  human-readable with balanced lines. |
| `accruals/register.md` | `review-accruals` | Living register  -  rewritten on each run. |
| `revrec/{customer-slug}/{contract-slug}.json` | `calculate-revenue-recognition` | ASC 606 schedule per contract. |
| `financials/{YYYY-MM}/{statement}.md` | `generate-financial-statements` | `statement` ∈ pnl / balance-sheet / cash-flow / trial-balance. |
| `variance-analyses/{YYYY-MM}.md` | `run-variance-analysis` | Actual vs. budget vs. prior, with narrative. |
| `runway/{YYYY-MM-DD}.md` | `build-burn-runway-report` | Burn + runway + sensitivity. |
| `investor-financials/{yyyy-qq}.md` | `prep-investor-financials` | Board-ready pack; optional Google Docs mirror. |
| `audits/{YYYY-MM-DD}.md` | `audit-books` | Books-in-shape punch list. |
| `compliance/1099s/{year}.md` | `track-vendor-1099s` | Vendor list + W-9 status + YTD totals. |
| `compliance/rd-credit/{year}.md` | `classify-rd-expenses` | Section 174 / R&D credit support. |
| `compliance/sales-tax/{YYYY-QN}.md` | `assess-sales-tax-nexus` | State-by-state exposure. |
| `handoffs/tax-{year}/` | `hand-off-to-tax` | Trial balance + recons + schedules + 1099 list + R&D breakout. |

### Transient run state (inside `runs/{period}/`)

`process-statements` and `run-monthly-close` dispatch Haiku /
Sonnet subagents that write transient state under
`runs/{period}/`:

- `_extractions/{pdf_stem}.json`  -  one file per source PDF, written
  by the Haiku extractor. Schema in the skill body.
- `_work/{account_last4}.json`  -  one work packet per account,
  assembled by the orchestrator for the categorizer subagents.
- `_categorizations/{account_last4}.json`  -  one file per account,
  written by the Sonnet categorizer.
- `_sheet_state/{period}.json`  -  one file per run, written by the
  Sonnet Sheets Writer. Records spreadsheet_id, URL, verification
  status, and any `error_cells`.

`_extractions/`, `_work/`, `_categorizations/`, and `_sheet_state/`
are safe to delete once `run.json` is finalized and flipped to
`ready` in `outputs.json`. Keep them while iterating  -  Gate 1 /
Gate 2 re-dispatches may need them.

---

## Journal-entry schema

Every JE  -  whether drafted by `prep-journal-entry`, embedded in a
close package, or written as part of a revrec schedule  -  follows:

```ts
interface JournalEntry extends BaseRecord {
  date: string;                          // YYYY-MM-DD
  type: "accrual" | "prepaid" | "payroll" | "revrec"
      | "depreciation" | "stock-comp" | "adjustment" | "reclass";
  memo: string;                          // one-line description
  reversing: boolean;                    // true if this is a reversing entry
  reversesEntryId?: string;              // links back to the original if reversing
  period: string;                        // "YYYY-MM" accounting period
  lines: {
    glCode: string;                      // text, validated against CoA
    glName: string;
    debit: number;                       // 0 if credit-only
    credit: number;                      // 0 if debit-only
    memo?: string;
  }[];
  status: "draft" | "ready" | "posted";
  postedTo?: "qbo" | "xero" | "manual";
  postedAt?: string;
  supportingDocs?: string[];             // paths to source docs
}
```

**Invariants:**

- `sum(lines[].debit) === sum(lines[].credit)` within 1 cent.
- Every `glCode` must exist in `config/chart-of-accounts.json`.
- `reversing: true` requires `reversesEntryId` to be set AND the
  reversing entry's sign convention to be the opposite of the
  original.
- Never write `status: "posted"` without an explicit user
  confirmation that the entry was posted to the GL.

---

## Run artifact schema (`runs/{period}/run.json`)

```ts
interface Run extends BaseRecord {
  period: string;                        // "2024-Q1" | "2024-01" | "2024"
  periodStart: string;                   // YYYY-MM-DD
  periodEnd: string;                     // YYYY-MM-DD
  accounts: {
    last4: string;
    type: "checking" | "savings" | "credit-card" | "payment-processor";
    bank: string;
    glCode: string;
    transactionCount: number;
  }[];
  transactions: {
    accountLast4: string;
    date: string;                        // YYYY-MM-DD
    description: string;
    amount: number;                      // signed: money out = negative
    statementDate?: string;
    party: string;                       // canonicalized
    glCode: string;
    glName: string;
    confidence: number;
    source: "rule" | "prior_year" | "ai" | "transfer";
    categoryStatus: "ready_for_approval" | "review_categorization" | "uncategorized";
  }[];
  reconciliationWarnings: string[];
  sheetUrl?: string;
  sheetVerification?: {
    pnlNetIncome: number;
    pnlAdjustedNetIncome: number;
    suspenseTotal: number;
    errorCells: string[];
  };
}
```

---

## No cross-agent reads

This agent is self-contained. There are no `../{other-agent}/...`
paths anywhere in this agent's skills. Everything lives under this
folder.
