---
name: evaluate-candidate
description: "Use when you say 'screen this resume' / 'screen the stack for {role}' / 'score {LinkedIn URL}' / 'is this candidate a fit' — I evaluate against role rubric based on `source` you pick: `resume` parses PDF(s) via Google Drive or Dropbox, produces pass / borderline / fail bands plus ranked stack · `linkedin` scrapes public profile via Firecrawl, scores 0-100 across 4-6 sub-criteria. Writes per-candidate records to `candidates/{candidate-slug}.md`."
integrations:
  scrape: [firecrawl]
  files: [googledrive, googlesheets]
---

# Evaluate Candidate

Two paths, same output: one candidate file per applicant, scored against role rubric. Pick `source` based on what in front of you.

## When to use

- `source=resume` — "screen this resume", "screen resume stack for {role}", "rank these resumes", "who strongest on pile". Single and batch both supported.
- `source=linkedin` — "score {LinkedIn URL}", "is candidate fit for {role}", "rate this profile", "0-100 on this LinkedIn". One per invocation. Batch = run many times.

Both chain into `prep-interviewer` and `debrief-loop`, which expect `candidates/{slug}.md` exist.

## Ledger fields I read

- `universal.company` — stage shapes how hard to pattern-match scope vs raw credentials.
- `domains.people.ats` — optional connected ATS (Ashby / Greenhouse / Lever / Workable), writes back candidate state if you ask.
- `domains.people.reqs` — active open reqs, where rubrics live.

Missing required field → ask ONE targeted question with modality hint (Composio connection > file drop > URL > paste), write, continue.

## Parameter: `source`

- `resume` — parses resume PDF(s) from connected Google Drive / Dropbox (or pasted files) via Composio docs tool. Batch-capable: N resumes → each own record AND ranked summary. Output band: **pass / borderline / fail**.
- `linkedin` — scrapes LinkedIn or public-profile URL via Composio web-scrape tool (Firecrawl). Output: 0-100 total + 4-6 sub-scores (level-fit, domain-fit, scope, tenure, culture-signal) with profile evidence cited per sub-score.

## Steps

1. **Read ledger**, fill gaps with ONE targeted question.
2. **Read `context/people-context.md`.** Missing or empty → tell you: "I need people context first — run define-people-context skill." Stop. Pull leveling framework for target level.
3. **Read req.** Open `reqs/{role-slug}.md` for criteria rubric. Missing → ask ONE targeted question ("What role? Top 3 must-haves?") and write `reqs/{role-slug}.md`.
4. **Branch on `source`:**

   - **If `source = resume`:**
     1. Locate resumes. Attached or folder connected → run `composio search docs` to discover docs tool slug (Google Drive / Dropbox) and list PDFs. Paths pasted → use those. Neither → ask ONE question naming best modality ("Connect Google Drive / Dropbox from Integrations, or paste resume files.") and stop.
     2. Parse each resume. Execute docs slug to extract text. Pull structured fields per candidate: name, contact; education (school, degree, dates); roles (company, title, dates, tenure); skills (stated + inferred from role descriptions); notable projects / publications. Mark ambiguous fields UNKNOWN — never infer.
     3. Evaluate against rubric. Per candidate, score each criterion pass / borderline / fail with one-line reason citing resume evidence (or "not stated in resume" → UNKNOWN). Overall band. 3-5 red flags (tenure pattern, skill-gap vs must-haves, unexplained gaps). Never flag protected-class attributes.
     4. Write one record per applicant to `candidates/{candidate-slug}.md` (slug = kebab-case `{first-last}`). File exists → append new dated `## Screen {YYYY-MM-DD}` section — never overwrite. Per section: Structured fields → Rubric scoring → Overall band → Red flags → Suggested next step (interview / reject with rationale). Atomic write.
     5. More than one resume → build ranked summary table (name → band → one-line reason → candidate path), include in `outputs.json` summary text.

   - **If `source = linkedin`:**
     1. Parse URL. Accept LinkedIn or any public-profile URL. Derive `{candidate-slug}` from URL or stated name (kebab-case `first-last`).
     2. Discover scrape tool: `composio search web-scrape`. Nothing connected → tell you which category to link and stop.
     3. Scrape. Execute slug. Extract: current title + company + tenure; prior roles (company, title, dates, tenure); education; skills (stated + inferred from role / headline); recent activity (posts, publications, speaking); geo if stated. Mark ambiguous fields UNKNOWN. Scrape empty or gated → say so, ask for paste of profile summary.
     4. Score 0-100 against rubric. Break into 4-6 sub-scores (e.g. level-fit, domain-fit, scope-signal, tenure-signal, culture-signal). Each sub-score 0-25 with one-line reason citing profile evidence. Total ≤ 100.
     5. Produce: background summary (3-5 sentences), total + sub-scores with reasoning, 3-5 red flags to probe in interviews. Never infer protected-class attributes.
     6. Write to `candidates/{candidate-slug}.md`. File exists → append `## LinkedIn Score {YYYY-MM-DD}` — never overwrite. Doesn't exist → create with header stub then score section. Atomic write.

5. **Append to `outputs.json`** with:
   ```json
   {
     "id": "<uuid v4>",
     "type": "candidate-evaluation",
     "title": "<source> — <candidate name or stack count>",
     "summary": "<2-3 sentences; for batch: counts by band + top 3>",
     "path": "candidates/<candidate-slug>.md",
     "status": "draft",
     "createdAt": "<ISO>",
     "updatedAt": "<ISO>",
     "domain": "hiring"
   }
   ```
   Batch resume runs → one entry per batch with `path: "candidates/"`.
6. **Summarize.** One paragraph.
   - `resume`: count screened, bands breakdown, top 3 named with file paths.
   - `linkedin`: total score, top 2 reasons high/low, top 2 red flags, candidate file path.

## Outputs

- `candidates/{candidate-slug}.md` per applicant (appended; created if missing).
- Appends to `outputs.json` with `type: "candidate-evaluation"`, `domain: "hiring"`.

## What I never do

- Infer or score protected-class attributes (race, gender, age 40+, pregnancy, disability, religion, national origin, sexual orientation, veteran status). Only objective criteria rubric.
- Invent credentials, references, or claims. Resume / LinkedIn thin or gated → mark UNKNOWN, ask for paste.
- Overwrite prior candidate sections — always append dated sections.
- Commit to hire / no-hire. That call yours; I band and flag.