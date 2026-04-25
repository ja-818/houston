# Google Sheets Output — Composio-Based

> **Audience:** This file is loaded by the **Sheets Writer subagent** (Sonnet, dispatched by the orchestrator in Step 6). It is the complete instruction manual for creating the bookkeeping workbook via Composio. The orchestrator does not execute any Composio calls directly.

Output target: **one Google Spreadsheet** per bookkeeping run, owned by the user's Google account, with the same structure we previously built in Excel. All writes go through the Composio CLI.

## Composio CLI

Binary location: **`/Users/milo/.composio/composio`** (not on PATH — always use the full path or `export PATH="$HOME/.composio:$PATH"` at the top of your Bash commands).

Core commands used in this skill:

```bash
# Look up a tool's input schema (use when in doubt about parameter names)
composio execute <TOOL_SLUG> --get-schema

# Validate-only (doesn't actually execute — good for dev)
composio execute <TOOL_SLUG> --dry-run -d '<json>'

# Execute
composio execute <TOOL_SLUG> -d '<json>'
```

All inputs are JSON passed to `-d`. You can also pass `@path/to/file.json` to read from a file — useful for big `values` arrays.

## Toolkit: `googlesheets`

Confirm it's connected before running the pipeline:

```bash
composio execute GOOGLESHEETS_SEARCH_SPREADSHEETS -d '{"query": "", "max_results": 1}'
```

If it returns `"No active connection found"`, surface the Composio link URL to the user and stop until they connect.

## Tools We Use

| Tool | Purpose |
|------|---------|
| `GOOGLESHEETS_CREATE_GOOGLE_SHEET1` | Create the spreadsheet, get `spreadsheetId` + URL |
| `GOOGLESHEETS_ADD_SHEET` | Add each additional worksheet (Summary, P&L, Transactions, CoA, Recon sheets, Warnings) |
| `GOOGLESHEETS_UPDATE_VALUES_BATCH` | Main workhorse — batch-write all data + formulas in one call per sheet |
| `GOOGLESHEETS_VALUES_UPDATE` | Single-range fallback if batch is overkill |
| `GOOGLESHEETS_GET_SPREADSHEET_INFO` | Get numeric `sheetId` for each tab (needed for formatting + freezing) |
| `GOOGLESHEETS_FORMAT_CELL` | Bold headers, currency number formats, fill colors |
| `GOOGLESHEETS_UPDATE_SHEET_PROPERTIES` | Freeze row 1 on every sheet, set tab colors |
| `GOOGLESHEETS_AUTO_RESIZE_DIMENSIONS` | Auto-fit column widths after data is in |
| `GOOGLESHEETS_MUTATE_CONDITIONAL_FORMAT_RULES` | Row highlighting for category status (red/yellow/no fill) |

## Critical Parameter: `value_input_option`

**Always pass `"value_input_option": "USER_ENTERED"`** when writing data that contains formulas. This makes Sheets parse strings starting with `=` as formulas (`=SUMIFS(...)` becomes a live formula, not a string).

- `RAW` — stores literally as typed. Formulas become text. **Do NOT use.**
- `USER_ENTERED` — parses like a human typing into the cell. **Use this everywhere.**

## Efficient Write Strategy

A real statement can produce 500–2000 transactions. Writing cell-by-cell would be slow and hit rate limits. Instead:

1. **Create the spreadsheet** (1 call: `CREATE_GOOGLE_SHEET1`).
2. **Add all tabs up front** (1 call per tab: `ADD_SHEET`).
3. **Resize tabs** that need more than the default 1000 rows × 26 cols (transactions sheet might need 2000+ rows). Use `APPEND_DIMENSION`.
4. **One batch write per sheet**, loading the entire 2D array of values+formulas at once:
   ```json
   {
     "spreadsheet_id": "...",
     "value_input_option": "USER_ENTERED",
     "data": [
       {"range": "Transactions!A1:N<last_row>", "values": [[...], [...], ...]}
     ]
   }
   ```
5. **One round of formatting** — combine header bold + column number formats into as few `FORMAT_CELL` calls as possible (group contiguous blocks).
6. **Conditional formatting** — add 2–3 rules in one `MUTATE_CONDITIONAL_FORMAT_RULES` call per sheet.
7. **Freezes + tab colors** — one `UPDATE_SHEET_PROPERTIES` per sheet.
8. **Auto-resize columns** — one call per sheet after data is in.

## Workbook Structure (same as before, Google-adapted)

### Sheet order (tabs, left to right)
1. **Summary** — cover page
2. **P&L** — formula-driven
3. **Transactions** — master ledger
4. **Chart of Accounts**
5. **Recon - {last4}** — one per bank account
6. **Warnings** — reconciliation issues

### Sheet: Transactions

Column order is load-bearing for downstream formulas. Same 14 columns as before:

| Col | Header |
|-----|--------|
| A | Date |
| B | Account Last4 |
| C | Account Type |
| D | Description |
| E | Party |
| F | Amount |
| G | GL Code |
| H | GL Name |
| I | Category Status |
| J | Confidence |
| K | Source |
| L | Source PDF |
| M | Source Page |
| N | Notes |

- **Column H is a formula** for consistency with the CoA:
  `=IFERROR(VLOOKUP(G2, 'Chart of Accounts'!A:B, 2, FALSE), "UNKNOWN CODE")`
  (Google Sheets accepts the same syntax — just make sure the sheet name `Chart of Accounts` is quoted with single quotes as shown.)
- Column G (GL Code) must be stored as text. Google Sheets can coerce `"6090"` to a number; to force text, **prefix with a leading apostrophe** in the write: `"'6090"`. When parsed with `USER_ENTERED`, the apostrophe is stripped and the cell is marked as text. Without this, sort order and SUMIFS string-matching break.
- Column F (Amount) should display as currency. Apply number format `"$#,##0.00;[Red]($#,##0.00)"` via `FORMAT_CELL` after the write.
- **Freeze row 1** via `UPDATE_SHEET_PROPERTIES` with `gridProperties.frozenRowCount = 1`.
- **Conditional formatting** on column I (Category Status):
  - `uncategorized` → red background fill (e.g. `{red:1, green:0.8, blue:0.8}`)
  - `review_categorization` → yellow background (`{red:1, green:0.95, blue:0.8}`)
  - `ready_for_approval` → no fill
  - Applied via `MUTATE_CONDITIONAL_FORMAT_RULES` with a `TEXT_EQ` boolean rule on column I.

### Sheet: Chart of Accounts

Three columns: `Code | Name | Type`. Write all CoA entries. Freeze row 1.

### Sheet: P&L — formulas only, no static totals

Structure (the critical invariant here is that **every total is a formula**, never a computed value written as a number):

```
Row  A                              B                                                      C
1    {Client} — Profit & Loss
2    Period: {start} to {end}
3
4    REVENUE
5    4000 Sales Revenue             =SUMIFS(Transactions!F:F, Transactions!G:G, "4000")
6    4100 Service Revenue           =SUMIFS(Transactions!F:F, Transactions!G:G, "4100")
...
10   Total Revenue                  =SUM(B5:B9)                                             100%
11
12   COST OF GOODS SOLD
13   5000 COGS                      =-SUMIFS(Transactions!F:F, Transactions!G:G, "5000")
...
18   Total COGS                     =SUM(B13:B17)
19
20   GROSS PROFIT                   =B10-B18                                                =IFERROR(B20/B10, 0)
21
22   OPERATING EXPENSES
23   6000 Advertising & Marketing   =-SUMIFS(Transactions!F:F, Transactions!G:G, "6000")
...
42   Total Operating Expenses       =SUM(B23:B41)
43
44   NET INCOME                     =B20-B42                                                =IFERROR(B44/B10, 0)
45
46   — memo —
47   Suspense (6200)                =-SUMIFS(Transactions!F:F, Transactions!G:G, "6200")
48   ADJUSTED NET INCOME            =B44-B47
49       (Net Income minus Suspense — shows the cost of unreviewed transactions)
```

Notes:
- Expense SUMIFS values are stored negative (money out). Prepend `-` to flip them for display: `=-SUMIFS(...)`.
- Format column B as currency, column C as percent (`0.0%`).
- Bold the section header rows, Total rows, and Net Income / Adjusted Net Income.
- **Highlight ADJUSTED NET INCOME row in amber** (e.g. `{red:1, green:0.93, blue:0.7}`) — use conditional formatting: if `B47 != 0`, highlight the row. The operator must not miss it.
- **Do not hardcode any dollar amount on this sheet.** Every number is a formula.

### Sheet: Recon - {last4}

One per unique `account_last4`. Header row, then one row per statement for that account:

| Col | Header |
|-----|--------|
| A | Period (e.g. "2025-01-01 to 2025-01-31") |
| B | Opening Balance |
| C | Transaction Sum (formula — SUMIFS filtered by last4 + date range) |
| D | Computed Close (=B+C) |
| E | Reported Close |
| F | Variance (=D-E) |

Conditional format column F: if `ABS(F) > 0.02` → red fill, else green.

### Sheet: Warnings

| Col | Header |
|-----|--------|
| A | Severity (WARN / INFO) |
| B | Source (PDF or statement) |
| C | Issue |
| D | Suggested Action |

Empty list is fine — sheet still exists, just with headers.

### Sheet: Summary

Top-level KPIs, all formulas:

```
Row  A                              B
1    {Client} Bookkeeping Summary
2    Period: {start} to {end}
3    Generated: {today}
4
5    Statements processed:          {count as integer — this one IS static, from the run}
6    Transactions extracted:        =COUNTA(Transactions!A:A)-1
7    Total transaction volume:      =SUMPRODUCT(ABS(Transactions!F2:F{last_row}))
8
9    Net Income:                    ='P&L'!B44
10   Suspense:                      ='P&L'!B47
11   Adjusted Net Income:           ='P&L'!B48
12
13   Ready for approval:            =COUNTIF(Transactions!I:I, "ready_for_approval")
14   Needs review:                  =COUNTIF(Transactions!I:I, "review_categorization")
15   Uncategorized:                 =COUNTIF(Transactions!I:I, "uncategorized")
```

## Verification Before Declaring Done

After the run, do these checks via Composio:

1. **Get sheet info**: `composio execute GOOGLESHEETS_GET_SPREADSHEET_INFO -d '{"spreadsheet_id": "..."}'` — confirm all tabs exist.
2. **Sample a formula cell**: `composio execute GOOGLESHEETS_BATCH_GET -d '{"spreadsheet_id": "...", "ranges": ["P&L!B10"], "value_render_option": "FORMULA"}'` — confirm the cell actually contains `=SUM(B5:B9)` (formula), not a number string.
3. **Confirm USER_ENTERED worked** — if formulas came back as string values, you wrote with `RAW` by accident. Redo those writes.
4. Only then return the Google Sheet URL to the user.

## Sample End-to-End Call Sequence

Pseudocode showing the order of Composio calls for a full run:

```bash
CLI=/Users/milo/.composio/composio

# 1. Create spreadsheet
SPREADSHEET_ID=$($CLI execute GOOGLESHEETS_CREATE_GOOGLE_SHEET1 \
  -d '{"title": "AcmeCo 2025 Bookkeeping"}' | jq -r '.data.spreadsheetId')
SPREADSHEET_URL=$($CLI execute GOOGLESHEETS_GET_SPREADSHEET_INFO \
  -d "{\"spreadsheet_id\": \"$SPREADSHEET_ID\"}" | jq -r '.data.spreadsheetUrl')

# 2. Add tabs (they'll be 1-indexed; default Sheet1 exists — rename it to Summary)
for tab in "Summary" "P&L" "Transactions" "Chart of Accounts" "Warnings"; do
  $CLI execute GOOGLESHEETS_ADD_SHEET \
    -d "{\"spreadsheet_id\": \"$SPREADSHEET_ID\", \"title\": \"$tab\"}"
done
# Plus one Recon sheet per account_last4

# 3. Resize Transactions sheet if >1000 rows needed
$CLI execute GOOGLESHEETS_APPEND_DIMENSION \
  -d '{"spreadsheet_id": "...", "sheet_id": <numeric>, "dimension": "ROWS", "length": 2000}'

# 4. Batch write values+formulas (one call, all sheets in the `data` array)
$CLI execute GOOGLESHEETS_UPDATE_VALUES_BATCH -d @/tmp/batch_write.json

# 5. Formatting (one call per style block)
$CLI execute GOOGLESHEETS_FORMAT_CELL -d '{...bold headers...}'
$CLI execute GOOGLESHEETS_FORMAT_CELL -d '{...currency columns...}'

# 6. Freeze row 1 on every sheet
$CLI execute GOOGLESHEETS_UPDATE_SHEET_PROPERTIES \
  -d '{"spreadsheet_id": "...", "sheet_id": ..., "grid_properties": {"frozen_row_count": 1}, "fields": "gridProperties.frozenRowCount"}'

# 7. Conditional formatting on Transactions column I
$CLI execute GOOGLESHEETS_MUTATE_CONDITIONAL_FORMAT_RULES -d '{...}'

# 8. Auto-resize columns
$CLI execute GOOGLESHEETS_AUTO_RESIZE_DIMENSIONS -d '{...}'

# Report the URL to the user
echo "$SPREADSHEET_URL"
```

## Landmines Specific to the Sheets Output

1. **`USER_ENTERED` vs `RAW`** — if you forget `USER_ENTERED`, all formulas become text strings. Silent breakage: the sheet looks populated but every total is a literal `=SUM(B5:B9)` string. Always set `USER_ENTERED` explicitly in every write.
2. **GL Code coercion to number** — `"6090"` becomes `6090` (numeric). Then `SUMIFS(..., G:G, "6090")` misses everything because the cell has a number, not a string. Use `"'6090"` in the write payload. Verify by reading back the first few GL Code cells.
3. **Sheet name quoting in formulas** — if your tab name has a space (like `Chart of Accounts` or `P&L`), you **must** wrap it in single quotes inside formulas: `'Chart of Accounts'!A:B`. `Chart of Accounts!A:B` is a syntax error.
4. **Default tab** — `CREATE_GOOGLE_SHEET1` creates a default `Sheet1`. Don't leave it around — either rename it to `Summary` (first tab use) via `UPDATE_SHEET_PROPERTIES` or delete it after adding your tabs.
5. **Numeric `sheetId` vs tab title** — most formatting/freeze calls need the numeric `sheetId` (an integer Google assigns), not the tab title. Call `GOOGLESHEETS_GET_SPREADSHEET_INFO` once after tab creation and build a `{title: sheetId}` map.
6. **Rate limits** — Google Sheets API has a write quota. Batch everything. If you get a 429, back off and retry.
7. **Column letters ≥ AA** — default new sheets are 26 columns (A-Z). Our Transactions sheet has 14 columns (A-N), well within range. But if you add a column, verify range strings still fit.
