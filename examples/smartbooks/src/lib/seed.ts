/**
 * Files seeded into the agent directory on first creation.
 *
 * This is what makes "Bookkeeper" a bookkeeper — a CLAUDE.md persona + a
 * pair of Python scripts the agent can read, run, and *edit*. The "soft
 * workflow" demo (user asks for a new column → Claude rewrites the script)
 * only works because the scripts actually live on disk.
 */

export const CLAUDE_MD = `# Bookkeeper

You are SmartBooks' AI bookkeeper. You work with small-business owners
who are NOT technical. Never mention files, JSON, configs, scripts, or
terminal commands when you talk to them. Use everyday bookkeeping
language.

## The SmartBooks model

The SmartBooks app is a spreadsheet. The user drops bank statements in,
a table of categorized transactions appears. That's the 90% path — it
runs deterministically through \`scripts/\` with zero LLM calls per
statement.

Your job is the other 10%: when the user asks for something the
default pipeline doesn't handle, you **edit the code** so it does.
Every correction becomes a permanent rule the pipeline applies from
then on. You are the compiler, not the runtime.

## Clients layout

Every piece of work belongs to a client:

\`\`\`
clients/
  <client-slug>/
    client.json          metadata — you read, never edit
    statements/          raw PDFs the user uploaded (input)
    workbook.csv         the flat source-of-truth (for the UI table)
    workpaper.xlsx       the downloadable multi-sheet Excel (the deliverable)
    rules.md             client-specific rules you've codified (optional)
\`\`\`

Shared across all clients:

\`\`\`
scripts/
  extract_transactions.py    parses statements, runs categorize()
  generate_workbook.py       shapes the final columns + writes workbook.csv
\`\`\`

Every prompt the user sends you starts with a line like:

> (client: Acme Corp, folder: clients/acme-corp/)

Use that folder as the default scope for any work.

## The three things you do

### 1. Extract transactions from a newly-uploaded statement

Triggered automatically when the user drops a PDF. The UI will send
you this exact prompt:

> Process clients/<slug>/statements/<filename>. Write the full table
> to clients/<slug>/workbook.csv. If workbook.csv already exists,
> append new rows (dedup by date+description+amount).

Steps:
1. Read the PDF with your Read tool (PDFs render as pages).
2. If \`clients/<slug>/rules.md\` exists, read it first.
3. **Every row MUST include a \`source\` field with the statement's
   filename** (without the timestamp prefix the UI adds). The
   workpaper uses it as the sheet name, so this is load-bearing.
4. Run the pipeline:

   \`\`\`
   python scripts/extract_transactions.py \\
     clients/<slug> "<source>" < /tmp/rows.json \\
     | python scripts/generate_workbook.py \\
         clients/<slug>/workbook.csv \\
         clients/<slug>/workpaper.xlsx
   \`\`\`

   This writes BOTH the CSV (for the live UI table) and the Excel
   workpaper (for download).

5. **If the script complains about \`openpyxl\` missing**: run
   \`pip install openpyxl\` (or \`pip3 install openpyxl --user\` if
   the environment is restricted), then re-run the pipeline. This is
   a one-time setup per machine.

6. Reply with ONE short sentence. The UI renders the table itself.

### 2. Change the shape of the table OR the Excel

User says "add a Tax column," "split Description into Merchant and
Memo," "highlight refunds in red," "add a pivot chart," "rename the
Summary sheet," etc.

- Shape/column changes → edit the \`COLUMNS\` list or the \`write_csv\`
  function in \`scripts/generate_workbook.py\`.
- Excel-specific changes (sheets, formulas, styling) → edit the
  \`write_xlsx\` function in the same file. openpyxl gives you full
  workbook control (sheets, styles, formulas, number formats,
  conditional formatting, charts).

Both are GLOBAL changes — every client gets the new shape next
pipeline run. Re-run the pipeline for the current client so their
files reflect the change immediately.

**The .xlsx is the deliverable the user downloads.** When they ask
for a change "in the Excel," they mean this file — even if the
underlying data is the same. Be generous with openpyxl features:
they asked for a real spreadsheet, give them one.

### 3. Codify a correction or edge case

User says "Acme invoices are always Cloud, not Uncategorized," or
attaches receipts that aren't in the statement. Two levels of scope:

- **Per-client rule** → append to \`clients/<slug>/rules.md\` in plain
  English. The \`extract_transactions.py\` script reads it and respects
  it for this client only.
- **Global rule** → edit \`scripts/extract_transactions.py\`'s
  \`categorize()\` function so every client benefits.

Choose the narrower scope by default. Tell the user what you wrote and
where, in their language ("I'll remember that Acme's charges are Cloud
for this client — next statement will pick it up.").

## Ground rules

- \`workbook.csv\` and \`workpaper.xlsx\` both live at
  \`clients/<slug>/\` — ONE of each per client, updated in place.
  Do not produce date-stamped copies.
- Append, don't overwrite, when the user adds a second statement for
  the same client. Dedup by (date, description, amount).
- Keep CSV columns stable unless the user asks to change them. Default
  columns: \`date, description, amount, category, source\`. The
  \`source\` column is LOAD-BEARING — every downstream view depends
  on it.
- When you edit \`generate_workbook.py\`, always re-run the pipeline
  for the current client so the .xlsx reflects the change.
- When you change a script or rules file, summarize in plain English.
- Never invent transactions. If a PDF is unreadable, say so.
- Reply in ONE short sentence. The UI surfaces the data; you don't
  need to restate it.
`;

export const EXTRACT_PY = `"""Extract + categorize transactions.

Claude reads the PDF with its Read tool, builds a JSON list of raw
rows (date, description, amount, direction), and pipes it into this
script on stdin. This script normalizes + categorizes every row,
applying BOTH the global rules in categorize() AND the per-client
rules in clients/<slug>/rules.md if it exists.

Soft-workflow hook: claude edits the categorize() function when the
user asks for a GLOBAL rule, or appends to the client's rules.md for
a per-client rule.
"""

import json
import pathlib
import re
import sys


def categorize(description: str) -> str:
    """Global category rules. Claude edits this when the user asks."""
    d = description.lower()
    if any(k in d for k in ("uber", "lyft", "taxi")):
        return "Transport"
    if any(k in d for k in ("whole foods", "trader joe", "grocery")):
        return "Groceries"
    if any(k in d for k in ("aws", "gcp", "digitalocean", "linode")):
        return "Cloud"
    if any(k in d for k in ("stripe payout", "paypal payout")):
        return "Revenue"
    return "Uncategorized"


def load_client_rules(client_folder: pathlib.Path) -> list[tuple[re.Pattern, str]]:
    """Parse clients/<slug>/rules.md into a list of (regex, category)."""
    rules_file = client_folder / "rules.md"
    if not rules_file.exists():
        return []
    rules: list[tuple[re.Pattern, str]] = []
    # Format: one rule per line, "<pattern> -> <category>".
    # Claude writes these in plain English when the user asks.
    for line in rules_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "->" not in line:
            continue
        pattern, category = (p.strip() for p in line.split("->", 1))
        if not pattern or not category:
            continue
        try:
            rules.append((re.compile(pattern, re.IGNORECASE), category))
        except re.error:
            continue
    return rules


def normalize(rows: list[dict], client_folder: pathlib.Path, source: str) -> list[dict]:
    client_rules = load_client_rules(client_folder)
    out = []
    for r in rows:
        desc = r.get("description", "")
        amount = float(r.get("amount", 0))
        direction = r.get("direction", "debit")
        signed = amount if direction == "credit" else -amount
        # Client rules win over the global categorize().
        category = categorize(desc)
        for pattern, cat in client_rules:
            if pattern.search(desc):
                category = cat
                break
        out.append(
            {
                "date": r.get("date"),
                "description": desc,
                "amount": signed,
                "category": category,
                # LOAD-BEARING: the UI groups transactions by source
                # to render one tab per statement. Pass-through from
                # the CLI arg so every row traces back to its PDF.
                "source": r.get("source") or source,
            }
        )
    return out


if __name__ == "__main__":
    # Usage: extract_transactions.py <client_folder> <source_name>
    #   stdin = rows JSON
    if len(sys.argv) < 3:
        print(
            "usage: extract_transactions.py <client_folder> <source_name>",
            file=sys.stderr,
        )
        sys.exit(2)
    client_folder = pathlib.Path(sys.argv[1]).resolve()
    source = sys.argv[2]
    rows = json.load(sys.stdin)
    json.dump(normalize(rows, client_folder, source), sys.stdout, indent=2)
`;

export const GENERATE_WORKBOOK_PY = `"""Shape the final CSV table AND the Excel workpaper.

Reads normalized rows on stdin, merges them with any existing rows,
writes:

  1. clients/<slug>/workbook.csv    — the flat source-of-truth
  2. clients/<slug>/workpaper.xlsx  — a multi-sheet Excel with:
        - Summary     (totals by category + KPIs)
        - Transactions (every row, all sheets flattened)
        - <statement>  (one sheet per distinct source filename)

The CSV is the canonical data. The XLSX is the deliverable the user
downloads. If openpyxl isn't available, the script writes the CSV
and skips the XLSX with a warning — Claude's CLAUDE.md tells it to
\`pip install openpyxl\` and re-run when that happens.

Soft-workflow hook: claude edits this file when the user asks for
column changes, new sheets, formulas, formatting, etc. The Excel
shape is 100% determined by this script.
"""

import csv
import json
import pathlib
import re
import sys

# The default column set. Claude edits this list when the user asks
# for a new column (e.g. add "tax" after "amount"). The "source"
# column is load-bearing for the UI tabs — NEVER remove it unless
# the user explicitly asks.
COLUMNS = ["date", "description", "amount", "category", "source"]


def load_existing(path: pathlib.Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def dedup_key(row: dict) -> tuple:
    return (str(row.get("date")), str(row.get("description")), str(row.get("amount")))


def merge(existing: list[dict], incoming: list[dict]) -> list[dict]:
    seen = {dedup_key(r) for r in existing}
    combined = list(existing)
    for r in incoming:
        if dedup_key(r) in seen:
            continue
        combined.append(r)
        seen.add(dedup_key(r))
    return sorted(combined, key=lambda r: str(r.get("date", "")), reverse=True)


def write_csv(rows: list[dict], output_path: pathlib.Path) -> pathlib.Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)
    return output_path


def write_xlsx(rows: list[dict], xlsx_path: pathlib.Path) -> pathlib.Path | None:
    """Build a multi-sheet workpaper. Returns None if openpyxl missing."""
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
        from openpyxl.utils import get_column_letter
    except ImportError:
        print(
            "[generate_workbook] openpyxl not installed — skipping xlsx."
            " Run: pip install openpyxl",
            file=sys.stderr,
        )
        return None

    wb = Workbook()
    # Remove the default sheet; we add our own in order.
    default = wb.active
    wb.remove(default)

    header_fill = PatternFill("solid", fgColor="0F6B4F")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    subtotal_fill = PatternFill("solid", fgColor="F0EFE8")
    subtotal_font = Font(bold=True, size=11)
    thin = Side(style="thin", color="E3E1D9")
    border = Border(top=thin, bottom=thin, left=thin, right=thin)

    def style_header(ws, ncols):
        for col in range(1, ncols + 1):
            cell = ws.cell(row=1, column=col)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="left", vertical="center")
            cell.border = border
        ws.row_dimensions[1].height = 20

    def autosize(ws, headers, data_rows):
        for i, h in enumerate(headers, start=1):
            width = max(len(str(h)), 8)
            for r in data_rows:
                v = r.get(h, "")
                width = max(width, min(len(str(v)), 48))
            ws.column_dimensions[get_column_letter(i)].width = width + 2

    # ---------- Summary sheet ----------
    summary = wb.create_sheet("Summary")
    summary.append(["Category", "Count", "Money in", "Money out", "Net"])
    style_header(summary, 5)

    by_cat: dict[str, dict] = {}
    total_in = 0.0
    total_out = 0.0
    for r in rows:
        try:
            amount = float(r.get("amount", 0) or 0)
        except (TypeError, ValueError):
            continue
        cat = r.get("category") or "Uncategorized"
        bucket = by_cat.setdefault(
            cat, {"count": 0, "inflow": 0.0, "outflow": 0.0, "net": 0.0}
        )
        bucket["count"] += 1
        if amount >= 0:
            bucket["inflow"] += amount
            total_in += amount
        else:
            bucket["outflow"] += amount
            total_out += amount
        bucket["net"] += amount

    for cat, b in sorted(by_cat.items(), key=lambda kv: abs(kv[1]["net"]), reverse=True):
        summary.append([cat, b["count"], b["inflow"], b["outflow"], b["net"]])

    totals_row = summary.max_row + 2
    summary.cell(row=totals_row, column=1, value="TOTALS").font = subtotal_font
    summary.cell(
        row=totals_row, column=3, value=f"=SUM(C2:C{totals_row - 2})"
    ).font = subtotal_font
    summary.cell(
        row=totals_row, column=4, value=f"=SUM(D2:D{totals_row - 2})"
    ).font = subtotal_font
    summary.cell(
        row=totals_row, column=5, value=f"=SUM(E2:E{totals_row - 2})"
    ).font = subtotal_font
    for col in range(1, 6):
        summary.cell(row=totals_row, column=col).fill = subtotal_fill

    # Number format on money columns.
    for col_letter in ("C", "D", "E"):
        for row in range(2, summary.max_row + 1):
            cell = summary[f"{col_letter}{row}"]
            if cell.value is not None:
                cell.number_format = '"$"#,##0.00;[Red]-"$"#,##0.00'
    autosize(summary, ["Category", "Count", "Money in", "Money out", "Net"], [])

    # ---------- Transactions sheet (all rows) ----------
    all_sheet = wb.create_sheet("Transactions")
    all_sheet.append(COLUMNS)
    style_header(all_sheet, len(COLUMNS))
    for r in rows:
        all_sheet.append([r.get(c, "") for c in COLUMNS])
    for row in range(2, all_sheet.max_row + 1):
        cell = all_sheet.cell(row=row, column=COLUMNS.index("amount") + 1)
        cell.number_format = '"$"#,##0.00;[Red]-"$"#,##0.00'
    autosize(all_sheet, COLUMNS, rows)
    all_sheet.freeze_panes = "A2"

    # ---------- One sheet per statement ----------
    by_source: dict[str, list[dict]] = {}
    for r in rows:
        src = r.get("source") or "Unsourced"
        by_source.setdefault(src, []).append(r)

    for src, src_rows in by_source.items():
        name = sanitize_sheet_name(src)
        sheet = wb.create_sheet(name)
        sheet.append(COLUMNS)
        style_header(sheet, len(COLUMNS))
        for r in src_rows:
            sheet.append([r.get(c, "") for c in COLUMNS])
        for row in range(2, sheet.max_row + 1):
            cell = sheet.cell(row=row, column=COLUMNS.index("amount") + 1)
            cell.number_format = '"$"#,##0.00;[Red]-"$"#,##0.00'
        # Sheet-level subtotal.
        subtotal_row = sheet.max_row + 2
        sheet.cell(row=subtotal_row, column=1, value="Subtotal").font = subtotal_font
        amount_col = COLUMNS.index("amount") + 1
        col_letter = chr(ord("A") + amount_col - 1)
        cell = sheet.cell(
            row=subtotal_row,
            column=amount_col,
            value=f"=SUM({col_letter}2:{col_letter}{subtotal_row - 2})",
        )
        cell.font = subtotal_font
        cell.number_format = '"$"#,##0.00;[Red]-"$"#,##0.00'
        for col in range(1, len(COLUMNS) + 1):
            sheet.cell(row=subtotal_row, column=col).fill = subtotal_fill
        autosize(sheet, COLUMNS, src_rows)
        sheet.freeze_panes = "A2"

    xlsx_path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(xlsx_path)
    return xlsx_path


def sanitize_sheet_name(name: str) -> str:
    """Excel sheet names: max 31 chars, no \\ / ? * [ ] : and can't be empty."""
    cleaned = re.sub(r"[\\\\/?*\\[\\]:]", " ", name).strip()
    if not cleaned:
        cleaned = "Statement"
    return cleaned[:31]


if __name__ == "__main__":
    # Usage: generate_workbook.py <csv_path> <xlsx_path>  (stdin = rows JSON)
    if len(sys.argv) < 3:
        print(
            "usage: generate_workbook.py <csv_path> <xlsx_path>",
            file=sys.stderr,
        )
        sys.exit(2)
    csv_path = pathlib.Path(sys.argv[1]).resolve()
    xlsx_path = pathlib.Path(sys.argv[2]).resolve()
    incoming = json.load(sys.stdin)
    existing = load_existing(csv_path)
    merged = merge(existing, incoming)

    written_csv = write_csv(merged, csv_path)
    written_xlsx = write_xlsx(merged, xlsx_path)

    print(str(written_csv))
    if written_xlsx is not None:
        print(str(written_xlsx))
`;

export const README_MD = `# Bookkeeper — SmartBooks agent

This agent was created by the SmartBooks custom frontend talking to
\`houston-engine\`. Everything under \`.houston/\` and \`scripts/\` is
owned by the agent. The app never touches this directory directly — it
just sends prompts and reads outputs.

Try asking:

- "Process this statement" (drop a PDF)
- "Add a Tax column to the workbook"
- "For client Acme, treat anything under $20 as a tip"
`;

/** Seed map passed to engine.createAgent({ seeds }). Relative paths from agent root. */
export const SEEDS: Record<string, string> = {
  "scripts/extract_transactions.py": EXTRACT_PY,
  "scripts/generate_workbook.py": GENERATE_WORKBOOK_PY,
  "README.md": README_MD,
};
