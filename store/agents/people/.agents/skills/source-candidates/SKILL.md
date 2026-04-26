---
name: source-candidates
description: "Use when you say 'find candidates for {role}' / 'source engineers from GitHub' / 'build a sourcing list for {role}'  -  given a role and signal source (GitHub, LinkedIn, community posts, conference lists, OSS repos), pulls candidates matching the role's rubric via Firecrawl or a connected scrape tool, scores each against the must-haves, and writes a ranked sourcing list to `sourcing-lists/{role-slug}-{YYYY-MM-DD}.md`."
version: 1
tags: [people, source, candidates]
category: People
featured: yes
image: busts-in-silhouette
integrations: [github, linkedin, firecrawl]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Source Candidates

## When to use

- Explicit: "find candidates for {role}", "source engineers from GitHub", "build a sourcing list for {role}", "source 20 candidates for {role} from {signal}".
- Implicit: kicked off by founder at start of hiring push, or during req-planning session.
- Safe per-role per-signal. Keep lists short (≤ 30 per pass) so rankings meaningful.

## Steps

1. **Read people-context doc** at `context/people-context.md`. If missing or empty, tell user: "I need your people context first  -  run the define-people-context skill." Stop. Extract leveling framework and existing team-shape notes for target role.
2. **Read req.** Look for `reqs/{role-slug}.md`. If missing, ask ONE targeted question ("What's the level target and the top 3 must-haves for {role}? I'll save a short rubric to `reqs/{role-slug}.md` and continue."). Write it, continue.
3. **Read ledger.** `config/context-ledger.json`  -  connected ATS (for dedup later) and open reqs list (`domains.people.reqs`).
4. **Confirm signal source** named (GitHub repo / org, LinkedIn search URL, community post / forum, conference attendee list, OSS contributor graph). If none named, ask one targeted question.
5. **Discover tools via Composio.** Run `composio search web-scrape` for LinkedIn / public-profile scraping and `composio search ats` if ATS consulted for dedup. If required category unconnected, tell user which to link from Integrations. Stop.
6. **Pull candidates.** Execute discovered tool slugs against signal source. Cap ~30 results. Per candidate, capture: name, profile / signal URL, current role + company, tenure, key skills observable in signal, one-line "why this signal is relevant" note.
7. **Score against rubric.** Per candidate, mark must-haves hit / missing vs rubric from step 2. Produce 0-3 fit band: **strong / maybe / weak**. Surface up to 3 red flags per candidate (tenure pattern, geo / authorization if stated, overlap with excluded companies per founder instruction). Never infer protected-class attributes.
8. **Write** sourcing list to `sourcing-lists/{role-slug}-{YYYY-MM-DD}.md` atomically (`*.tmp` → rename). Structure: Role summary (level + must-haves from rubric) → Top 5 highest-conviction reach-outs → Ranked table of all candidates (name, link, fit band, 1-line reason, red flags).
9. **Append to `outputs.json`**  -  read existing array, add `{ id, type: "sourcing", title, summary, path, status: "draft", createdAt, updatedAt }`, write atomically.
10. **Summarize to user**  -  one paragraph naming top 5 reach-outs, path to full list, category / tool used.

## Never invent

Every candidate must trace to real, verifiable signal URL. If profile private / 404 / ambiguous, mark candidate UNKNOWN on that field  -  no guess tenure, title, skills.

## Outputs

- `sourcing-lists/{role-slug}-{YYYY-MM-DD}.md`
- Appends to `outputs.json` with type `sourcing`.