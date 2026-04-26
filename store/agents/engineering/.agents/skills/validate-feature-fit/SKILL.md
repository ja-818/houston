---
name: validate-feature-fit
description: "Use when you say 'validate {feature} before I build it' / 'go/no-go on {feature}'  -  I scrape the competitor landscape via Firecrawl and web search, assess alignment to observable demand, and produce a verdict (build / defer / skip) with the evidence behind it. Writes to `feature-fit/{slug}.md` and flags assumptions I couldn't test from the desk so you know what to probe with real users."
version: 1
tags: [engineering, validate, feature]
category: Engineering
featured: yes
image: laptop
integrations: [slack, twitter, firecrawl, perplexityai]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Validate Feature Fit

Market-fit gate before roadmap commit. One engineering-strategy
decision skill: build / defer / skip, grounded in auditable evidence.
Source template: Gumloop "Feature Market fit Validator", reframed so
deliverable = short markdown verdict founder hand to `plan-roadmap` next.

## When to use

- "validate {feature} before I build it" / "is {feature} good bet"
  / "go/no-go on {feature}".
- "someone suggested {feature}  -  should we build it?"
- Implicitly by `triage-inbound-request` when request big enough
  warrant market testing before routing to roadmap.

## Steps

1. **Read engineering-context.md** (own file). If missing, STOP  -
   tell user run `define-engineering-context` first. Feature fit
   without context (who we sell to, what we stand for) produces
   generic verdicts.

2. **Gather inputs**  -  ask ONE tight question per missing piece
   (best modality hint first):
   - **Feature idea**  -  one-line description + user-visible
     change. (Best: paste. Or point at PRD URL.)
   - **Target audience**  -  which ICP segment benefits most. (Best:
     paste one line. Default to context doc priorities if
     silent.)
   - **Problem statement**  -  specific pain this removes. Push
     for verbatim customer language if founder has any (sales
     call, support email, Slack DM).

3. **Discover tools at runtime.** Do NOT hardcode tool names. Run:
   - `composio search web-scrape`  -  competitor pages,
     changelogs, pricing pages.
   - `composio search web-search`  -  recent news, user
     complaints, adjacent launches.

   If needed category no connected tool, note in verdict ("no
   web-scrape connection  -  competitor evidence: UNKNOWN") and
   continue.

4. **Scrape competitor landscape.** For each competitor named in
   context doc (or top 3-5 user names):
   - Feature already solve this pain? If yes, capture URL +
     quote of positioning.
   - Public complaint about that feature (forums, reviews,
     Twitter)? If yes, capture verbatim.
   - Adjacent product shipping toward this problem (e.g. new
     API, beta)?

5. **Assess demand signal.** Look for:
   - Direct user requests (in `call-insights/` if exists across
     agents  -  skip if not connected; do not invent).
   - Competitor movement (frequency + recency of related ships).
   - Public complaints about status quo (real quotes with URLs).

6. **Render verdict.** One of:
   - **GO (build)**  -  strong evidence, differentiated angle, fits
     roadmap.
   - **DEFER**  -  real signal but timing wrong (missing prerequisite,
     wait for market clarity).
   - **SKIP**  -  thin signal, crowded market, or off-positioning.

   Verdict must name 2-3 load-bearing pieces of evidence.
   No hand-waving. If evidence thin, honest verdict is
   `DEFER  -  insufficient evidence; probe with {specific user
   action}`.

7. **Structure output (markdown, ~400-700 words),
   `feature-fit/{slug}.md`:**

   1. **Feature + audience + problem**  -  three lines, tight.
   2. **Verdict**  -  GO / DEFER / SKIP + one-sentence rationale.
   3. **Evidence**  -  bulleted with sources (URL + timestamp).
      Competitor moves, complaints, adjacent launches.
   4. **Assumptions not testable from desk**  -  what you'd want
      verify with real users before committing. Be specific:
      "run 5-user interview asking X".
   5. **Fit to current positioning**  -  does this advance one of
      top 3 priorities in context doc? Cite priority.
   6. **Recommended next step**  -  if GO, hand to `plan-roadmap`.
      If DEFER, name trigger to revisit. If SKIP, name what
      tell requester.

8. **Never invent evidence.** Every claim ties to URL with
   fetch timestamp or marked `UNKNOWN` explicitly. Verdict
   built on fake quotes worse than "I don't have evidence to
   call this  -  here's how to get it."

9. **Write atomically** to `feature-fit/{slug}.md`  -  `{path}.tmp`
   then rename. `{slug}` is kebab-case of feature name.

10. **Append to `outputs.json`.** Read-merge-write atomically:

    ```json
    {
      "id": "<uuid v4>",
      "type": "feature-fit",
      "title": "Feature fit  -  <feature>",
      "summary": "<2-3 sentences  -  verdict + top evidence + next step>",
      "path": "feature-fit/<slug>.md",
      "status": "draft",
      "createdAt": "<ISO-8601>",
      "updatedAt": "<ISO-8601>"
    }
    ```

11. **Summarize to user.** One paragraph: verdict + 2-3
    load-bearing pieces of evidence + exact next move + path
    to artifact.

## Outputs

- `feature-fit/{slug}.md`
- Appends to `outputs.json` with `type: "feature-fit"`.