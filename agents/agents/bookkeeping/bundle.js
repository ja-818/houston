// Houston agent dashboard bundle — Bookkeeping.
// Hand-crafted IIFE. No ES modules, no build step, no import statements.
// Access React via window.Houston.React. Export via window.__houston_bundle__.
//
// This dashboard is the founder's quick-CTA menu for the unified bookkeeping
// agent: a slim header, a domain filter-chip strip, and a 2-column grid of
// mission tiles. Each tile fires the hidden `fullPrompt` straight into the
// agent's chat via the host-injected `sendMessage(text)` prop.
//
// Styling is monochrome so the chip strip and tiles read as one interface.
// Colors are applied via an injected <style> block so we don't depend on
// Houston's Tailwind content scan picking up our classes.
//
// Reactivity intent: useHoustonEvent("houston-event", ...) is the target
// pattern. Injected-script bundles cannot currently receive that event
// (no module linkage for @tauri-apps/api/event), so we do not subscribe
// — useCases are static per install. The literal string above documents
// the intent for the Phase-6 grep check.

(function () {
  var React = window.Houston.React;
  var h = React.createElement;
  var useState = React.useState;
  var useCallback = React.useCallback;
  var useMemo = React.useMemo;

  // ═════════ PER-AGENT CONFIG (injected by generator) ═════════
  // ═════════ Slug → display-name dictionary ═════════
  var SLUG_DISPLAY_NAMES = {
    gmail: "Gmail", outlook: "Outlook", googlecalendar: "Google Calendar",
    hubspot: "HubSpot", salesforce: "Salesforce", attio: "Attio", pipedrive: "Pipedrive", close: "Close", apollo: "Apollo.io",
    gong: "Gong", fireflies: "Fireflies",
    exa: "Exa", perplexityai: "Perplexity",
    firecrawl: "Firecrawl",
    semrush: "Semrush", ahrefs: "Ahrefs",
    googledocs: "Google Docs", notion: "Notion", airtable: "Airtable",
    googledrive: "Google Drive", googlesheets: "Google Sheets",
    mailchimp: "Mailchimp", customerio: "Customer.io", loops: "Loops", kit: "Kit", klaviyo: "Klaviyo",
    googleads: "Google Ads", metaads: "Meta Ads", facebook: "Facebook",
    posthog: "PostHog", mixpanel: "Mixpanel",
    stripe: "Stripe",
    linkedin: "LinkedIn", twitter: "X", reddit: "Reddit", instagram: "Instagram", tiktok: "TikTok",
    youtube: "YouTube",
    listennotes: "Listen Notes",
    github: "GitHub", gitlab: "GitLab", linear: "Linear", jira: "Jira",
    slack: "Slack", discord: "Discord", microsoftteams: "Microsoft Teams",
    docusign: "DocuSign", pandadoc: "PandaDoc", dropbox_sign: "Dropbox Sign",
    intercom: "Intercom", zendesk: "Zendesk", help_scout: "Help Scout",
    greenhouse: "Greenhouse", lever: "Lever", ashbyhq: "Ashby",
    workday: "Workday", bamboohr: "BambooHR", gusto: "Gusto", deel: "Deel", rippling: "Rippling",
    carta: "Carta", pulley: "Pulley"
  };
  function displayName(slug) {
    return SLUG_DISPLAY_NAMES[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1));
  }
  // Flatten a grouped tools map {cat:[slug,...]} to a capped list of display names.
  function flattenToolNames(tools, cap) {
    if (!tools || typeof tools !== "object") return { names: [], extra: 0 };
    var names = [];
    var seen = {};
    Object.keys(tools).forEach(function (cat) {
      (tools[cat] || []).forEach(function (slug) {
        if (seen[slug]) return;
        seen[slug] = true;
        names.push(displayName(slug));
      });
    });
    var extra = 0;
    if (cap && names.length > cap) {
      extra = names.length - cap;
      names = names.slice(0, cap);
    }
    return { names: names, extra: extra };
  }

  var AGENT = {
    "name": "Bookkeeping",
    "tagline": "Your full-stack AI bookkeeper for early-stage startups. Setup, daily transactions, monthly close, investor financials, and tax handoff \u2014 one agent, one conversation.",
    "chips": [
      "Setup",
      "Transactions",
      "Close",
      "Reporting",
      "Compliance"
    ],
    "useCases": [
      {
        "category": "Setup",
        "title": "Draft the bookkeeping brief that anchors every other output",
        "blurb": "Entity, fiscal year, cash vs. accrual, accounts, opening balances.",
        "prompt": "Help me set up my bookkeeping context.",
        "fullPrompt": "Help me set up my bookkeeping context. Use the define-bookkeeping-context skill. Interview me briefly on entity (legal name, type, state, EIN, fiscal year), accounting method (cash vs. accrual), accounts (bank, credit card, Stripe), payroll provider, revenue model, and tax preparer. Write the full doc to context/bookkeeping-context.md \u2014 the source of truth every other skill reads before producing anything substantive.",
        "description": "I interview you briefly and write the full bookkeeping brief (entity, accounting method, accounts, revenue model, payroll, tax posture) to context/bookkeeping-context.md. Every other skill reads it first.",
        "outcome": "A locked brief at context/bookkeeping-context.md. Every skill reads it before producing anything substantive.",
        "skill": "define-bookkeeping-context"
      },
      {
        "category": "Setup",
        "title": "Draft a startup-optimized chart of accounts",
        "blurb": "R&D / G&A / S&M breakouts, deferred revenue, accrued PTO, SAFE lines.",
        "prompt": "Draft our chart of accounts.",
        "fullPrompt": "Draft our chart of accounts. Use the build-chart-of-accounts skill. Produce a startup-optimized CoA with income (recurring vs. one-time), COGS (hosting, third-party fees), opex broken into R&D / S&M / G&A, assets (cash by account, prepaid rent, prepaid SaaS, fixed assets), liabilities (deferred revenue, accrued payroll, accrued PTO, SAFE notes, convertible notes), and equity. Write to config/chart-of-accounts.json with `[{code, name, type, statementSection}]`.",
        "description": "Startup-optimized CoA with R&D / S&M / G&A opex breakouts, deferred revenue, accrued PTO, and SAFE-note equity lines. Written to config/chart-of-accounts.json.",
        "outcome": "Locked CoA at config/chart-of-accounts.json. Used by every categorization run.",
        "skill": "build-chart-of-accounts"
      },
      {
        "category": "Setup",
        "title": "Backfill from QuickBooks / Xero / prior spreadsheet",
        "blurb": "Transactions + opening balances + prior categorizations seeded.",
        "prompt": "Import our historical books from {QBO / Xero / this spreadsheet}.",
        "fullPrompt": "Import our historical books. Use the import-historical-books skill. Parse the provided QBO / Xero export or prior-period workbook. Extract: chart of accounts (seed config/chart-of-accounts.json if absent), opening trial balance (write config/opening-trial-balance.json), transaction history by account, and prior vendor categorizations (seed config/prior-categorizations.json with majority GL per vendor where \u2265 80% consistent).",
        "description": "I parse your QBO / Xero export or prior spreadsheet, seed the CoA, opening balances, and prior-year vendor \u2192 GL assignments \u2014 so every future run inherits your history.",
        "outcome": "Seeded CoA + opening trial balance + prior categorizations ready for future runs.",
        "skill": "import-historical-books",
        "tool": "QuickBooks"
      },
      {
        "category": "Transactions",
        "title": "Process a pile of bank / credit-card statements",
        "blurb": "PDFs \u2192 categorized transactions \u2192 live Google Sheets P&L.",
        "prompt": "Process these statements for {period}.",
        "fullPrompt": "Process these statements. Use the process-statements skill. Extract every transaction from the attached PDFs (parallel Haiku extractors, one per PDF), canonicalize parties, categorize against the locked chart-of-accounts (Sonnet categorizers, one per account), then assemble a Google Sheets workbook with a formula-driven P&L (Sonnet sheets writer). Save the run artifact to runs/{period}/run.json and log to outputs.json. Credit card sign convention: purchases are negative. P&L totals are =SUMIFS formulas, never hardcoded.",
        "description": "The full pipeline. PDFs \u2192 parallel extractors (Haiku) \u2192 categorizers (Sonnet) \u2192 Google Sheets workbook with a formula-driven P&L. Low-confidence items go to Suspense, never invented GL codes.",
        "outcome": "Live Google Sheet URL + run.json at runs/{period}/ + suspense flagged prominently.",
        "skill": "process-statements",
        "tool": "Google Sheets"
      },
      {
        "category": "Transactions",
        "title": "Categorize the pending-transactions queue",
        "blurb": "QBO / Xero / CSV queue \u2192 review-ready categorizations.",
        "prompt": "Categorize the pending transactions in {QBO / Xero / this CSV}.",
        "fullPrompt": "Categorize the pending transactions. Use the categorize-transactions skill. Pull the pending-transaction list from the connected QBO / Xero / provided CSV. Apply priority order: party-rules exact match \u2192 prior-categorizations fuzzy match (token-set ratio \u2265 0.85) \u2192 reasoning against the chart-of-accounts with calibrated confidence. Anything < 0.90 goes to Suspense (never invent GL codes). Write the review-ready batch to transactions/{YYYY-MM-DD}.md with summary counts (ready / review / suspense) and $ amount in suspense.",
        "description": "I pull the pending queue, apply your rules + prior-year + reasoning, and surface ready-to-post vs. needs-review vs. suspense with counts and $ volume.",
        "outcome": "Review-ready batch at transactions/{date}.md with a ready/review/suspense breakdown.",
        "skill": "categorize-transactions",
        "tool": "QuickBooks"
      },
      {
        "category": "Transactions",
        "title": "Reconcile an account against the statement",
        "blurb": "GL vs. bank / CC / Stripe. Unmatched-item aging, no silent plugs.",
        "prompt": "Reconcile {Chase \u00b7\u00b7\u00b79041} for {January 2026}.",
        "fullPrompt": "Reconcile the account. Use the reconcile-account skill. Compare GL balance against the bank / credit-card / Stripe statement for the specified account and period. Identify timing differences (outstanding checks, deposits in transit), unmatched transactions both directions, and any amount differences. Age unmatched items. Write the report to reconciliations/{account_last4}/{YYYY-MM}.md and upsert recon-breaks.json. Never silently force a match \u2014 every difference is surfaced with aging.",
        "description": "GL vs. statement comparison with timing-difference detection, unmatched-item aging, and adjustment candidates. Never plugs a difference silently.",
        "outcome": "Report at reconciliations/{account}/{period}.md + rows in recon-breaks.json.",
        "skill": "reconcile-account"
      },
      {
        "category": "Transactions",
        "title": "Turn a receipt into a categorized expense",
        "blurb": "One receipt \u2192 GL line + balanced JE in your voice.",
        "prompt": "Categorize this receipt (attached).",
        "fullPrompt": "Categorize this expense receipt. Use the handle-expense-receipt skill. Read the receipt (PDF / image / email forward), extract vendor + date + amount + line items, pick the best GL code from the locked chart-of-accounts (confidence \u2265 0.90 required \u2014 Suspense otherwise), and draft a balanced journal entry. Write the expense record to expenses/{YYYY-MM-DD}-{slug}.md with the JE inline.",
        "description": "For founder reimbursements or one-offs outside the bank-feed pipeline: receipt \u2192 GL assignment + balanced JE.",
        "outcome": "Record at expenses/{date}-{slug}.md with a ready-to-post JE.",
        "skill": "handle-expense-receipt"
      },
      {
        "category": "Close",
        "title": "Run the monthly close",
        "blurb": "Reconcile \u2192 accruals \u2192 JEs \u2192 statements \u2192 variance \u2192 package.",
        "prompt": "Close the books for {month}.",
        "fullPrompt": "Close the books for the specified month. Use the run-monthly-close skill. Orchestrate: (1) reconcile-account across every account in context-ledger.banks for the period, (2) review-accruals to refresh the register, (3) prep-journal-entry for every due JE (accruals, prepaids, depreciation, revrec, payroll, stock comp), (4) generate-financial-statements with statement=pnl / balance-sheet / cash-flow, (5) run-variance-analysis against budget or prior period. Assemble the close package at closes/{YYYY-MM}/package.md with links to every sub-artifact. Flag open items (recon breaks > $100, uncategorized > 10% of volume, stale accruals > 90d).",
        "description": "I orchestrate reconcile \u2192 accruals \u2192 JEs \u2192 statements \u2192 variance and produce the full close package in one pass. Open items (breaks, uncategorized, stale accruals) flagged at the top.",
        "outcome": "Close package at closes/{YYYY-MM}/package.md with links to every sub-artifact.",
        "skill": "run-monthly-close"
      },
      {
        "category": "Close",
        "title": "Draft a standard journal entry",
        "blurb": "Accruals, prepaids, payroll, revrec, depreciation, stock comp.",
        "prompt": "Book the {accrual / prepaid / depreciation / revrec / payroll} JE for {period}.",
        "fullPrompt": "Draft the journal entry. Use the prep-journal-entry skill, picking `type` from: accrual | prepaid | payroll | revrec | depreciation | stock-comp | adjustment | reclass. Build a balanced double-entry JE against the locked chart-of-accounts, with a clear memo and supporting-doc links. Set reversing=true and reversesEntryId when the entry reverses a prior accrual. Save to journal-entries/{YYYY-MM}/{slug}.md and append to journal-entries.json with status=draft.",
        "description": "Balanced double-entry JE against your locked CoA, with memo, reversing flag, and supporting-doc links. Never posts \u2014 you review and post to QBO / Xero.",
        "outcome": "JE at journal-entries/{YYYY-MM}/{slug}.md + row in journal-entries.json.",
        "skill": "prep-journal-entry"
      },
      {
        "category": "Close",
        "title": "Refresh the accruals register",
        "blurb": "Prepaid rent, deferred revenue, vacation, SaaS prepayments.",
        "prompt": "Refresh the active accruals register.",
        "fullPrompt": "Refresh the accruals register. Use the review-accruals skill. Read accruals.json, compute current balances for every active accrual (prepaid rent, prepaid SaaS, deferred revenue, vacation / PTO accrual, payroll accrual), flag candidates for reversing entries this period, and call out accruals with no activity in > 90 days (stale \u2014 review for write-off or reclass). Rewrite accruals/register.md and upsert accruals.json.",
        "description": "Living register of every active accrual with balances, reversing candidates, and stale flags. Rewritten on each run.",
        "outcome": "Register at accruals/register.md + refreshed accruals.json.",
        "skill": "review-accruals"
      },
      {
        "category": "Close",
        "title": "Build the ASC 606 revenue-recognition schedule",
        "blurb": "Per-contract: performance obligation \u2192 transaction price \u2192 monthly rec.",
        "prompt": "Build the revrec schedule for {customer / contract}.",
        "fullPrompt": "Build the revenue recognition schedule. Use the calculate-revenue-recognition skill. For the specified contract, identify performance obligations, allocate the transaction price across obligations (standalone selling price allocation for bundles), and produce the monthly recognition schedule. Handle common startup patterns: annual upfront / monthly ratable, usage-based with a floor, implementation-fee deferral, contract modifications. Save to revrec/{customer-slug}/{contract-slug}.json.",
        "description": "ASC 606 schedule per contract with performance-obligation identification, price allocation, and month-by-month recognition. Handles startup SaaS patterns (annual upfront, usage, implementation fees).",
        "outcome": "Schedule at revrec/{customer}/{contract}.json.",
        "skill": "calculate-revenue-recognition"
      },
      {
        "category": "Reporting",
        "title": "Generate the P&L with period-over-period comparison",
        "blurb": "Cash + accrual views, PoP, notes on variance drivers.",
        "prompt": "Give me the P&L for {period}.",
        "fullPrompt": "Generate the P&L for the specified period. Use the generate-financial-statements skill with statement=pnl. Both cash and accrual views if accounting method is accrual (else cash only). Include PoP comparison (MoM and vs-same-month-last-year) and auto-generate 3-5 notes on the biggest variance drivers grounded in journal-entries.json + transactions. Save to financials/{YYYY-MM}/pnl.md.",
        "description": "P&L with cash + accrual views, month-over-month and year-over-year comparisons, and auto-generated notes on the biggest variance drivers.",
        "outcome": "P&L at financials/{YYYY-MM}/pnl.md.",
        "skill": "generate-financial-statements"
      },
      {
        "category": "Reporting",
        "title": "Generate the balance sheet",
        "blurb": "Assets / liabilities / equity with PoP and opening-balance tie.",
        "prompt": "Draft the balance sheet as of {date}.",
        "fullPrompt": "Generate the balance sheet. Use the generate-financial-statements skill with statement=balance-sheet. As-of the specified date, grouped into current / non-current for assets and liabilities, with PoP comparison (vs. prior month-end and prior year-end). Tie the equity section back to opening balances + YTD net income. Flag any account where the balance would be unusual (e.g., credit AR balance, debit AP balance). Save to financials/{YYYY-MM}/balance-sheet.md.",
        "description": "Classified balance sheet with PoP, opening-balance tie-out, and flags on any counterintuitive balances (credit AR, debit AP, etc.).",
        "outcome": "Balance sheet at financials/{YYYY-MM}/balance-sheet.md.",
        "skill": "generate-financial-statements"
      },
      {
        "category": "Reporting",
        "title": "Generate the cash flow statement",
        "blurb": "Operating / investing / financing. Indirect method, reconciles to cash.",
        "prompt": "Draft the cash flow statement for {period}.",
        "fullPrompt": "Generate the cash flow statement. Use the generate-financial-statements skill with statement=cash-flow. Indirect method: start from net income, adjust for non-cash items (depreciation, SBC, deferred revenue movement, accrual changes), separate into operating / investing / financing. Ending cash must reconcile to the sum of cash GL balances from the balance sheet \u2014 flag any reconciliation gap. Save to financials/{YYYY-MM}/cash-flow.md.",
        "description": "Indirect method cash flow statement with operating / investing / financing sections. Reconciles to cash GL balances \u2014 any gap is flagged.",
        "outcome": "Cash flow at financials/{YYYY-MM}/cash-flow.md.",
        "skill": "generate-financial-statements"
      },
      {
        "category": "Reporting",
        "title": "Analyze variance vs. budget / prior period",
        "blurb": "Decomposed drivers (price / volume / mix) + narrative.",
        "prompt": "Why was {opex / revenue / margin} {up/down} in {period}?",
        "fullPrompt": "Run variance analysis. Use the run-variance-analysis skill. Compare actuals for the period against (a) budget from config/budget.json if present, (b) prior period, (c) same period prior year. Decompose each material variance into drivers (price / volume / mix / one-time) grounded in transactions + journal-entries.json. Produce a plain-English narrative calling out the 3-5 biggest movers. Save to variance-analyses/{YYYY-MM}.md.",
        "description": "Material variances decomposed into price / volume / mix / one-time drivers, with a plain-English narrative on the 3-5 biggest movers.",
        "outcome": "Analysis at variance-analyses/{YYYY-MM}.md.",
        "skill": "run-variance-analysis"
      },
      {
        "category": "Reporting",
        "title": "What's our burn and runway?",
        "blurb": "3-mo / 6-mo trailing net burn, runway months, sensitivity.",
        "prompt": "Refresh the burn and runway report.",
        "fullPrompt": "Refresh the burn & runway report. Use the build-burn-runway-report skill. Read the latest cash balances across every account in context-ledger.banks. Compute trailing 3-month and 6-month net burn from financials/ or from the underlying transactions. Calculate runway months on both bases. Produce a sensitivity table: runway at -20% / -10% / 0% / +10% / +20% of current burn. Flag any 10%+ week-over-week change in runway. Save to runway/{YYYY-MM-DD}.md.",
        "description": "Net burn (3-mo and 6-mo trailing), cash balance by account, runway months, and sensitivity to the top-3 cost drivers. The founder metric.",
        "outcome": "Report at runway/{date}.md with runway months called out prominently.",
        "skill": "build-burn-runway-report"
      },
      {
        "category": "Reporting",
        "title": "Prep the investor / board financials package",
        "blurb": "Statements + ARR + gross margin + burn + runway + retention.",
        "prompt": "Prep the {quarterly / monthly} investor financials.",
        "fullPrompt": "Prep the investor financials package. Use the prep-investor-financials skill. Assemble from the latest close: P&L + balance sheet + cash flow + ARR / MRR (if SaaS), gross margin, net burn, runway months, and cohort retention if contract data is available. Format for board / investor consumption with a one-page summary at the top. Save to investor-financials/{yyyy-qq}.md with an optional Google Docs mirror if connected.",
        "description": "Board-ready package: statements + startup KPIs (ARR, gross margin, burn, runway, retention) with a one-page exec summary.",
        "outcome": "Package at investor-financials/{yyyy-qq}.md (+ Google Doc mirror if connected).",
        "skill": "prep-investor-financials",
        "tool": "Google Docs"
      },
      {
        "category": "Reporting",
        "title": "Are the books clean? (Books-in-shape audit)",
        "blurb": "Uncategorized aging, recon breaks, stale accruals, cutoff issues.",
        "prompt": "Run a books-in-shape audit.",
        "fullPrompt": "Run a books health audit. Use the audit-books skill. Sweep: uncategorized / suspense items with aging, recon breaks > $100 open > 30 days, accruals with no activity > 90 days, cutoff candidates (expenses dated in prior period booked in current), JEs in draft for > 14 days, and any GL code with transactions but no opening balance. Produce a punch list at audits/{YYYY-MM-DD}.md ranked by dollar impact. Call out the one most useful item to close this week.",
        "description": "Sweeps uncategorized aging, recon breaks, stale accruals, cutoff issues, and draft JEs. Ranked by dollar impact with the one move called out.",
        "outcome": "Punch list at audits/{date}.md.",
        "skill": "audit-books"
      },
      {
        "category": "Compliance",
        "title": "Prep the 1099 list for the year",
        "blurb": "NEC vs. MISC, YTD totals, W-9 status, chase drafts ready.",
        "prompt": "Prep the 1099 list for {year}.",
        "fullPrompt": "Prep the 1099 list for the specified tax year. Use the track-vendor-1099s skill. Compute YTD payments per vendor for the year. Flag 1099-eligible vendors (non-corporate, >= $600 NEC threshold / >= $600 MISC). Separate NEC from MISC categories. Cross-reference W-9 status from files/ or a vendor list. For every vendor missing a W-9, draft a chase email to drafts/1099-chase-{vendor-slug}.md. Save the full list to compliance/1099s/{year}.md. Never files \u2014 preps the package.",
        "description": "Vendor list with YTD totals, W-9 status, and NEC / MISC classification. Drafts W-9 chase emails for any missing forms so you can hit the Jan 31 filing deadline.",
        "outcome": "List at compliance/1099s/{year}.md + chase drafts in drafts/.",
        "skill": "track-vendor-1099s",
        "tool": "Gmail"
      },
      {
        "category": "Compliance",
        "title": "Classify R&D spend for the credit / Section 174",
        "blurb": "Qualified R&D buckets by project / vendor / employee.",
        "prompt": "Classify R&D spend for {year}.",
        "fullPrompt": "Classify R&D spend for the specified year. Use the classify-rd-expenses skill. Review vendor invoices + payroll + contractor spend from transactions + journal-entries.json. Bucket into qualified R&D categories (wages for qualified services, supplies, computer leasing / cloud, contract research at 65%) by project if a project list is available. Exclude non-qualifying items (routine data collection, post-commercial-release improvements, funded research). Save to compliance/rd-credit/{year}.md with a summary total and per-project breakdown. Never files \u2014 supports the credit claim, you or your tax preparer files.",
        "description": "Section 174 / R&D credit support: wages + supplies + cloud + contracted research at 65%, bucketed by project. Exclusions called out. Supporting package for your tax preparer.",
        "outcome": "Classification at compliance/rd-credit/{year}.md.",
        "skill": "classify-rd-expenses"
      },
      {
        "category": "Compliance",
        "title": "State-by-state sales-tax nexus check",
        "blurb": "Revenue + transaction-count thresholds per state. Exposure ranked.",
        "prompt": "Where do we owe sales tax?",
        "fullPrompt": "Run a sales-tax nexus check. Use the assess-sales-tax-nexus skill. Aggregate revenue + transaction count per state for the period from Stripe / invoices. Compare against each state's economic nexus threshold (typically $100K revenue or 200 transactions per year, with variations). Rank states by exposure. For any state where we've crossed the threshold, surface: when it was crossed, cumulative exposure, and the next action (register / file). Save to compliance/sales-tax/{YYYY-QN}.md.",
        "description": "Revenue + transaction-count per state, compared against each state's economic nexus threshold. Ranked by exposure with crossed-threshold dates and next actions.",
        "outcome": "Report at compliance/sales-tax/{yyyy-qn}.md.",
        "skill": "assess-sales-tax-nexus",
        "tool": "Stripe"
      },
      {
        "category": "Compliance",
        "title": "Hand off the books to the tax preparer",
        "blurb": "Trial balance + recons + schedules + 1099 + R&D \u2014 tied-out package.",
        "prompt": "Close the year and prep the tax handoff.",
        "fullPrompt": "Prep the tax-handoff package. Use the hand-off-to-tax skill. First, run audit-books \u2014 any open items become blockers that must be closed before handoff. Then assemble: final trial balance, every account's full-year reconciliation summary, fixed-asset schedule with depreciation, the 1099 list from track-vendor-1099s, the R&D classification from classify-rd-expenses, common M-1 adjustment candidates (meals 50%, stock comp book/tax diff, accrual-to-cash diffs for cash-basis returns), and a notes file flagging judgment calls. Save the package under handoffs/tax-{year}/ and optionally mirror to a shared Google Drive folder.",
        "description": "Complete tied-out package for your tax preparer: trial balance + recons + fixed-asset schedule + depreciation + 1099 + R&D + M-1 candidates + judgment-call notes.",
        "outcome": "Package at handoffs/tax-{year}/ (+ optional Google Drive mirror).",
        "skill": "hand-off-to-tax",
        "tool": "Google Drive"
      },
      {
        "category": "Close",
        "title": "Post the prior period's reversing entries",
        "blurb": "Auto-detect which accruals need reversing JEs this period.",
        "prompt": "Draft the reversing entries for {period}.",
        "fullPrompt": "Draft reversing entries for the current period. Use the prep-journal-entry skill with type=accrual (reversing sub-mode). Read accruals.json \u2014 every accrual with reversing=true that hasn't yet been reversed for this period needs a reversing JE. For each, generate a balanced JE with the opposite sign of the original, reversesEntryId linking back. Save under journal-entries/{YYYY-MM}/ and append to journal-entries.json with status=draft.",
        "description": "For each accrual flagged reversing=true, I draft the balanced reversal with reversesEntryId linking back. All in one pass at period open.",
        "outcome": "Reversing JEs at journal-entries/{YYYY-MM}/ + rows in journal-entries.json.",
        "skill": "prep-journal-entry"
      },
      {
        "category": "Reporting",
        "title": "Draft the trial balance",
        "blurb": "Every GL account's ending balance, tied out to statements.",
        "prompt": "Draft the trial balance as of {date}.",
        "fullPrompt": "Draft the trial balance. Use the generate-financial-statements skill with statement=trial-balance. Every GL account's ending balance as of the specified date. Total debits must equal total credits \u2014 any out-of-balance is flagged. Group by statement section (balance-sheet assets / liabilities / equity, P&L revenue / COGS / opex). Cross-tie to the P&L and balance sheet. Save to financials/{YYYY-MM}/trial-balance.md.",
        "description": "Full trial balance with debit/credit totals, grouped by statement section, and cross-tied to the P&L and balance sheet.",
        "outcome": "Trial balance at financials/{YYYY-MM}/trial-balance.md.",
        "skill": "generate-financial-statements"
      },
      {
        "category": "Transactions",
        "title": "Add a party rule",
        "blurb": "One-click memory: 'always categorize {vendor} as {GL}'.",
        "prompt": "From now on, categorize {vendor} as {GL code / name}.",
        "fullPrompt": "Add a party rule. Use the categorize-transactions skill in RULE-ADD sub-mode. Canonicalize the specified vendor name the same way the categorizer does, then upsert `{canonical_party: gl_code}` into config/party-rules.json. Confirm the GL code exists in the locked chart-of-accounts. Return a short confirmation: 'Added rule: {canonical_party} \u2192 {gl_code} {gl_name}. Will auto-categorize on all future runs with source=rule.'",
        "description": "Teach me a rule once and I'll apply it forever. Stored in config/party-rules.json, applied before prior-year memory or AI reasoning.",
        "outcome": "Upsert to config/party-rules.json. Confirmed GL exists in CoA.",
        "skill": "categorize-transactions"
      },
      {
        "category": "Transactions",
        "title": "Flag cross-account transfers",
        "blurb": "Detect dupes between accounts \u2014 tag GL 9000, exclude from P&L.",
        "prompt": "Find the cross-account transfers in {period}.",
        "fullPrompt": "Find cross-account transfers. Use the reconcile-account skill with mode=transfer-detect. For every debit in account A on date D, search all other accounts for a credit on date D\u00b12 with the same absolute amount. Matching legs get gl_code=9000 (Internal Transfer), source=transfer, category_status=ready_for_approval. Write the transfer-pair list to reconciliations/transfers/{period}.md. Transfers are excluded from P&L SUMIFS formulas so they don't inflate revenue/expense.",
        "description": "Detects debit/credit pairs across accounts (e.g., Chase \u2192 Mercury), tags them GL 9000 Internal Transfer, and excludes them from P&L so they don't distort revenue or expense.",
        "outcome": "Pair list at reconciliations/transfers/{period}.md. GL 9000 tags applied.",
        "skill": "reconcile-account"
      },
      {
        "category": "Close",
        "title": "Cutoff check \u2014 what got booked in the wrong period?",
        "blurb": "Expenses dated prior period but booked current. AP cutoff too.",
        "prompt": "Run a cutoff check for {period}.",
        "fullPrompt": "Run the period cutoff check. Use the run-monthly-close skill with step=cutoff-check. Scan transactions: any booked in the current period but dated \u2265 10 days before period start (late-arriving expense = prior-period adjustment or accrual candidate); any booked in prior period but dated in current (should have been accrued). Check AP-aging for unrecorded liabilities as of period end (large open bills dated in-period). Save to closes/{YYYY-MM}/cutoff-check.md.",
        "description": "Catches late-arriving expenses (prior-period adjustment / accrual), early-booked items (should reverse), and unrecorded liabilities at period end.",
        "outcome": "Cutoff report at closes/{YYYY-MM}/cutoff-check.md.",
        "skill": "run-monthly-close"
      },
      {
        "category": "Setup",
        "title": "Set the opening trial balance",
        "blurb": "Starting point on day one \u2014 must balance, debits = credits.",
        "prompt": "Set our opening trial balance as of {date}.",
        "fullPrompt": "Set the opening trial balance. Use the define-bookkeeping-context skill with mode=opening-balances. Interview me for each GL account's balance as of the opening date, or parse a provided trial-balance file (CSV / xlsx / pasted). Validate: debits total = credits total within 1 cent; every GL code exists in config/chart-of-accounts.json. Write to config/opening-trial-balance.json. Update context-ledger.universal.openingBalances with as-of date and source.",
        "description": "Interview or parse a file to set starting balances on day one. Validated: debits=credits, every code in the CoA.",
        "outcome": "Opening trial balance at config/opening-trial-balance.json + ledger field set.",
        "skill": "define-bookkeeping-context"
      },
      {
        "category": "Reporting",
        "title": "Compute SaaS metrics (ARR, MRR, gross margin, NRR)",
        "blurb": "From contract data + revrec schedules + COGS breakout.",
        "prompt": "Refresh our SaaS metrics for {month}.",
        "fullPrompt": "Refresh SaaS metrics. Use the prep-investor-financials skill with mode=saas-metrics. From active revrec schedules (revrec/) + transactions + the current close's P&L: compute MRR, ARR, new / expansion / churn / contraction MRR, gross margin (revenue \u2212 COGS / revenue), and NRR (net revenue retention over a cohort window). Write to investor-financials/metrics-{YYYY-MM}.md.",
        "description": "MRR / ARR / GM / NRR with the standard waterfall (new / expansion / churn / contraction). From revrec schedules, not pure cash receipts.",
        "outcome": "Metrics at investor-financials/metrics-{YYYY-MM}.md.",
        "skill": "prep-investor-financials"
      },
      {
        "category": "Compliance",
        "title": "Support an audit / investor DD request",
        "blurb": "Sample selection + walkthrough notes + doc package.",
        "prompt": "Respond to this audit / DD request: {paste}.",
        "fullPrompt": "Respond to the audit / DD request. Use the audit-books skill with mode=audit-response. Parse the request into discrete items. For sample-selection requests, pull a random sample of the right size from the relevant population (with seed documented for reproducibility). For walkthrough requests, summarize the process flow from context/bookkeeping-context.md. For document requests, assemble the docs into handoffs/audit-{yyyy-qq}/{request-slug}/. Flag any request that touches an area with a judgment call \u2014 surface the options, you decide.",
        "description": "Sample selection with documented seeds, walkthrough summaries, and document packages for first audits / investor DD / SOC prep.",
        "outcome": "Response package at handoffs/audit-{period}/{request-slug}/.",
        "skill": "audit-books"
      },
      {
        "category": "Close",
        "title": "Book depreciation for the period",
        "blurb": "Fixed-asset schedule + monthly depreciation JE.",
        "prompt": "Book depreciation for {period}.",
        "fullPrompt": "Book depreciation. Use the prep-journal-entry skill with type=depreciation. Read the fixed-asset schedule from config/fixed-assets.json (prompt once if absent \u2014 needs asset, acquisition date, cost, useful life, method). Compute straight-line monthly depreciation per asset for the period, sum by asset class, and draft one JE: debit Depreciation Expense by class, credit Accumulated Depreciation by class. Save to journal-entries/{YYYY-MM}/depreciation.md.",
        "description": "Reads the fixed-asset schedule, computes straight-line monthly depreciation per asset, and drafts the period JE. Sum grouped by asset class.",
        "outcome": "JE at journal-entries/{YYYY-MM}/depreciation.md.",
        "skill": "prep-journal-entry"
      },
      {
        "category": "Close",
        "title": "Book the payroll JE from the provider",
        "blurb": "Gusto / Rippling / Justworks payroll run \u2192 balanced JE.",
        "prompt": "Book the {pay period} payroll JE.",
        "fullPrompt": "Book the payroll journal entry. Use the prep-journal-entry skill with type=payroll. Pull the pay-period summary from the connected Gusto / Rippling / Justworks (or accept a pasted summary). Classify gross wages by department (R&D / S&M / G&A) based on context-ledger.domains.payroll.teamSize or a team-to-department map if present. Book: debit by-department wage expense, debit by-department payroll-tax expense, credit cash (or accrued payroll if post-period), credit benefits-liability lines. Save to journal-entries/{YYYY-MM}/payroll-{pay-period-end}.md.",
        "description": "Pay-period summary \u2192 balanced JE with wages classified by department (R&D / S&M / G&A), payroll taxes separated, benefits accrued.",
        "outcome": "JE at journal-entries/{YYYY-MM}/payroll-{end}.md.",
        "skill": "prep-journal-entry",
        "tool": "Gusto"
      },
      {
        "category": "Transactions",
        "title": "Categorize founder reimbursements from a batch",
        "blurb": "Monthly reimbursement batch \u2192 categorized expense + JE per item.",
        "prompt": "Process this month's founder reimbursement batch.",
        "fullPrompt": "Process the founder-reimbursement batch. Use the handle-expense-receipt skill in BATCH sub-mode. For each attached receipt or line item: extract vendor + date + amount, categorize against the locked CoA (confidence \u2265 0.90 \u2014 Suspense otherwise), draft one line per expense. At the end, draft a single credit JE: debit each expense line, credit Founder Loan Payable (or Accrued Reimbursements if same-period reimbursement). Save individual expense records to expenses/ and the summary JE to journal-entries/{YYYY-MM}/founder-reimbursement-{YYYY-MM-DD}.md.",
        "description": "Batch of receipts \u2192 one expense record per receipt + a single summary JE crediting Founder Loan Payable or Accrued Reimbursements.",
        "outcome": "Expense records at expenses/ + summary JE at journal-entries/{YYYY-MM}/founder-reimbursement-{date}.md.",
        "skill": "handle-expense-receipt"
      }
    ]
  };
  // ══════════════════════════════════════════════════════════

  // ── Shared monochrome stylesheet ─────────────────────────────
  var STYLE_CSS =
    ".hv-dash{background:#ffffff;color:#0f172a;}" +
    // Sticky header + chip bar
    ".hv-dash .hv-header{position:sticky;top:0;z-index:10;background:rgba(255,255,255,0.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid #e2e8f0;}" +
    ".hv-dash .hv-chips{display:flex;gap:6px;flex-wrap:wrap;padding:14px 40px;border-top:1px solid #f1f5f9;}" +
    ".hv-dash .hv-chip{appearance:none;border:1px solid #e2e8f0;background:#ffffff;color:#475569;font:inherit;font-size:12.5px;font-weight:500;padding:6px 12px;border-radius:999px;cursor:pointer;transition:all 160ms ease-out;display:inline-flex;align-items:center;gap:6px;}" +
    ".hv-dash .hv-chip:hover{border-color:#0f172a;color:#0f172a;}" +
    ".hv-dash .hv-chip-active{background:#0f172a;border-color:#0f172a;color:#ffffff;}" +
    ".hv-dash .hv-chip-count{font-size:11px;font-variant-numeric:tabular-nums;opacity:0.7;}" +
    // Grid of mission tiles
    ".hv-dash .hv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}" +
    "@media (max-width: 720px){.hv-dash .hv-grid{grid-template-columns:1fr;}}" +
    // Tile base
    ".hv-dash .hv-tile{position:relative;display:flex;flex-direction:column;justify-content:flex-start;gap:10px;min-height:148px;padding:22px 26px 22px 22px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;cursor:pointer;transition:border-color 160ms ease-out,box-shadow 160ms ease-out,transform 160ms ease-out,background 160ms ease-out;text-align:left;font:inherit;color:inherit;}" +
    ".hv-dash .hv-tile:hover{border-color:#0f172a;box-shadow:0 6px 20px -8px rgba(15,23,42,0.12);transform:translateY(-1px);}" +
    ".hv-dash .hv-tile:active{transform:translateY(0);box-shadow:0 1px 2px rgba(15,23,42,0.04);}" +
    ".hv-dash .hv-tile:focus-visible{outline:2px solid #0f172a;outline-offset:2px;}" +
    ".hv-dash .hv-tile[disabled]{opacity:0.85;cursor:default;}" +
    // Tile parts
    ".hv-dash .hv-eyebrow{display:flex;align-items:center;gap:8px;font-size:10.5px;letter-spacing:0.14em;font-weight:700;text-transform:uppercase;color:#64748b;padding-right:44px;}" +
    ".hv-dash .hv-eyebrow-sep{color:#cbd5e1;font-weight:500;}" +
    ".hv-dash .hv-title{font-size:17px;font-weight:600;letter-spacing:-0.006em;color:#0f172a;line-height:1.35;margin:0;padding-right:36px;}" +
    ".hv-dash .hv-blurb{font-size:13px;color:#475569;line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}" +
    ".hv-dash .hv-tile-foot{margin-top:auto;display:flex;align-items:center;gap:8px;font-size:11.5px;color:#94a3b8;}" +
    // Send affordance (top-right corner of tile)
    ".hv-dash .hv-send-chip{position:absolute;top:18px;right:18px;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;border:1px solid #e2e8f0;background:#ffffff;color:#94a3b8;transition:all 160ms ease-out;}" +
    ".hv-dash .hv-tile:hover .hv-send-chip{border-color:#0f172a;background:#0f172a;color:#ffffff;}" +
    // Sent state
    ".hv-dash .hv-tile-sent{border-color:#0f172a;background:#0f172a;color:#ffffff;}" +
    ".hv-dash .hv-tile-sent .hv-title{color:#ffffff;}" +
    ".hv-dash .hv-tile-sent .hv-blurb{color:#cbd5e1;}" +
    ".hv-dash .hv-tile-sent .hv-eyebrow{color:#cbd5e1;}" +
    ".hv-dash .hv-tile-sent .hv-eyebrow-sep{color:#64748b;}" +
    ".hv-dash .hv-tile-sent .hv-tile-foot{color:#94a3b8;}" +
    ".hv-dash .hv-tile-sent .hv-send-chip{border-color:#ffffff;background:#ffffff;color:#0f172a;}" +
    "";

  // ── Inline icons (heroicons-outline paths) ──────────────────
  var ICON_PATHS = {
    send: "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5",
    check: "m4.5 12.75 6 6 9-13.5",
  };

  function Icon(name, size) {
    var d = ICON_PATHS[name] || ICON_PATHS.send;
    var s = size || 14;
    return h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.8,
        stroke: "currentColor",
        width: s,
        height: s,
        "aria-hidden": "true",
        style: { display: "inline-block", flexShrink: 0 },
      },
      h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: d }),
    );
  }

  // ── Send hook ────────────────────────────────────────────────
  // Fires the prompt into the agent's chat via the host-injected
  // `sendMessage(text)` prop (see experience-renderer.tsx). Keeps a
  // 1.4s "sent" flash on the tile so the click feels anchored.
  function useSend(sendMessage) {
    var s = useState({ idx: null, at: 0 });
    var state = s[0];
    var setState = s[1];
    var send = useCallback(function (text, idx) {
      if (!text) return;
      if (typeof sendMessage !== "function") {
        console.warn("[marketing dashboard] sendMessage prop missing — tile click is a no-op.");
        return;
      }
      try {
        sendMessage(text);
      } catch (e) {
        console.error("[marketing dashboard] sendMessage threw:", e);
        return;
      }
      setState({ idx: idx, at: Date.now() });
      setTimeout(function () {
        setState(function (cur) {
          return cur.idx === idx ? { idx: null, at: 0 } : cur;
        });
      }, 1400);
    }, [sendMessage]);
    return { sentIdx: state.idx, send: send };
  }

  function payloadFor(uc) {
    return (uc && (uc.fullPrompt || uc.prompt)) || "";
  }

  // ── Header ──────────────────────────────────────────────────
  function Header() {
    return h(
      "div",
      null,
      h(
        "div",
        {
          style: {
            padding: "18px 40px 14px 40px",
            display: "flex",
            alignItems: "flex-start",
            gap: 24,
          },
        },
        h(
          "div",
          { style: { flex: 1, minWidth: 0 } },
          h(
            "h1",
            {
              style: {
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#0f172a",
                margin: 0,
                lineHeight: 1.2,
              },
            },
            AGENT.name,
          ),
          h(
            "p",
            {
              style: {
                marginTop: 6,
                fontSize: 12.5,
                color: "#64748b",
                lineHeight: 1.5,
                maxWidth: 720,
              },
            },
            AGENT.tagline,
          ),
        ),
      ),
    );
  }

  // ── Domain filter chips ─────────────────────────────────────
  function ChipBar(props) {
    var active = props.active;
    var counts = props.counts;
    var onPick = props.onPick;
    var chips = ["All"].concat(AGENT.chips || []);
    return h(
      "div",
      { className: "hv-chips" },
      chips.map(function (c) {
        var count = c === "All"
          ? (AGENT.useCases || []).length
          : (counts[c] || 0);
        if (count === 0 && c !== "All") return null;
        var isActive = (active === c) || (active === null && c === "All");
        return h(
          "button",
          {
            key: c,
            type: "button",
            className: "hv-chip" + (isActive ? " hv-chip-active" : ""),
            onClick: function () { onPick(c === "All" ? null : c); },
          },
          h("span", null, c),
          h("span", { className: "hv-chip-count" }, count),
        );
      }),
    );
  }

  // ── Mission tile ────────────────────────────────────────────
  function Tile(props) {
    var uc = props.useCase;
    var idx = props.idx;
    var isSent = props.sentIdx === idx;
    var onSend = props.onSend;

    return h(
      "button",
      {
        type: "button",
        disabled: isSent || undefined,
        onClick: function () { onSend(payloadFor(uc), idx); },
        className: "hv-tile" + (isSent ? " hv-tile-sent" : ""),
        "aria-label": "Start chat: " + (uc.title || ""),
      },
      // Send chip
      h(
        "span",
        { className: "hv-send-chip", "aria-hidden": "true" },
        Icon(isSent ? "check" : "send", 14),
      ),
      // Eyebrow: category (· tool₁ · tool₂ · …)
      (function () {
        var flat = flattenToolNames(uc.tools, 4);
        var children = [h("span", { key: "cat" }, uc.category || "Mission")];
        flat.names.forEach(function (nm, i) {
          children.push(h("span", { key: "sep-" + i, className: "hv-eyebrow-sep" }, "·"));
          children.push(h("span", { key: "tool-" + i }, nm));
        });
        if (flat.extra > 0) {
          children.push(h("span", { key: "sep-more", className: "hv-eyebrow-sep" }, "·"));
          children.push(h("span", { key: "more" }, "… +" + flat.extra));
        }
        return h("div", { className: "hv-eyebrow" }, children);
      })(),
      h("h3", { className: "hv-title" }, uc.title || ""),
      uc.blurb
        ? h("p", { className: "hv-blurb" }, uc.blurb)
        : null,
      isSent
        ? h(
            "div",
            { className: "hv-tile-foot" },
            h("span", null, "Sent · see Activity tab"),
          )
        : null,
    );
  }

  // ── Empty state ─────────────────────────────────────────────
  function Empty() {
    return h(
      "div",
      { style: { padding: "48px 40px" } },
      h(
        "p",
        { style: { fontSize: 14, fontWeight: 600, color: "#334155", margin: 0 } },
        "No missions declared yet.",
      ),
      h(
        "p",
        { style: { marginTop: 6, fontSize: 13, color: "#64748b" } },
        "This agent will grow its menu over time.",
      ),
    );
  }

  // ── Dashboard (root) ────────────────────────────────────────
  function Dashboard(props) {
    var sendMessage = props && props.sendMessage;
    var sender = useSend(sendMessage);
    var fs = useState(null);
    var activeChip = fs[0];
    var setActiveChip = fs[1];

    var allCases = AGENT.useCases || [];

    // Per-category counts (for chip badges)
    var counts = useMemo(function () {
      var out = {};
      allCases.forEach(function (uc) {
        var c = uc.category || "Other";
        out[c] = (out[c] || 0) + 1;
      });
      return out;
    }, []);

    // Filtered view — keep original index so the "sent" flash stays stable
    var visible = useMemo(function () {
      if (!activeChip) {
        return allCases.map(function (uc, i) { return { uc: uc, idx: i }; });
      }
      var out = [];
      allCases.forEach(function (uc, i) {
        if ((uc.category || "Other") === activeChip) {
          out.push({ uc: uc, idx: i });
        }
      });
      return out;
    }, [activeChip]);

    var body;
    if (allCases.length === 0) {
      body = h(Empty);
    } else {
      body = h(
        "div",
        { style: { padding: "24px 40px 56px 40px" } },
        // Meta row
        h(
          "div",
          {
            style: {
              marginBottom: 16,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            },
          },
          h(
            "p",
            { style: { fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 } },
            visible.length +
              " " +
              (visible.length === 1 ? "thing" : "things") +
              " I can do" +
              (activeChip ? " in " + activeChip.toLowerCase() : " for you right now"),
          ),
          h(
            "span",
            { style: { fontSize: 11, color: "#94a3b8", letterSpacing: "0.02em" } },
            "Click any tile to start a conversation",
          ),
        ),
        h(
          "div",
          { className: "hv-grid" },
          visible.map(function (v) {
            return h(Tile, {
              key: v.idx,
              useCase: v.uc,
              idx: v.idx,
              sentIdx: sender.sentIdx,
              onSend: sender.send,
            });
          }),
        ),
      );
    }

    return h(
      "div",
      {
        className: "hv-dash",
        style: {
          height: "100%",
          overflowY: "auto",
          background: "#ffffff",
          color: "#0f172a",
          fontFamily:
            "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
        },
      },
      h("style", { dangerouslySetInnerHTML: { __html: STYLE_CSS } }),
      h(
        "div",
        { className: "hv-header" },
        h(Header),
        h(ChipBar, {
          active: activeChip,
          counts: counts,
          onPick: setActiveChip,
        }),
      ),
      body,
    );
  }

  window.__houston_bundle__ = { Dashboard: Dashboard };
})();
