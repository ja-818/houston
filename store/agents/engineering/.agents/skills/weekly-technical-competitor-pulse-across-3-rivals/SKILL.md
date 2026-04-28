---
name: weekly-technical-competitor-pulse-across-3-rivals
description: "I scan each competitor's engineering blog, GitHub org activity, public changelog, and API diffs via Firecrawl and web search. Single-competitor teardown or N-competitor weekly digest, filtered for real threats vs noise."
version: 1
tags: ["engineering", "overview-action", "analyze"]
category: "Planning"
featured: yes
integrations: ["github", "gitlab", "firecrawl", "perplexityai"]
image: "laptop"
---


# Weekly technical competitor pulse across 3 rivals
**Use when:** Blog + GitHub + changelog + API diffs.
**What it does:** I scan each competitor's engineering blog, GitHub org activity, public changelog, and API diffs via Firecrawl and web search. Single-competitor teardown or N-competitor weekly digest, filtered for real threats vs noise.
**Outcome:** A digest at competitor-watch/weekly-{YYYY-MM-DD}.md  -  moves to respond to + ignore list.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me this week's technical competitor pulse across {Competitor A}, {Competitor B}, {Competitor C}. Use the analyze skill with subject=competitors. Scan each competitor's engineering blog, GitHub org activity (releases, major commits, star velocity), public changelog, and API diffs via Firecrawl + Exa. Label each signal technical-threat / parity-move / ignore. Save to competitor-watch/weekly-{YYYY-MM-DD}.md. If I name just one competitor instead of three, switch to teardown mode.
```
