---
name: write-an-adr-for-decision
description: "A Michael Nygard-style ADR so future-you (or a new hire) understands why the decision was made, not just what it was."
version: 1
tags: ["engineering", "overview-action", "write-adr"]
category: "Development"
featured: yes
integrations: ["discord", "firecrawl", "github", "gitlab", "jira", "linear", "loops", "notion", "perplexityai", "slack", "stripe", "twitter"]
image: "laptop"
inputs:
  - name: decision
    label: "Decision"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Write an Architecture Decision Record (ADR) for {{decision}}. Use the write-adr skill. Follow the Michael Nygard template: Title, Status (Proposed / Accepted / Deprecated / Superseded), Context, Decision, Consequences. Read context/engineering-context.md for stack. Keep it tight  -  one page, no padding. Save to adrs/{{date}}-{{slug}}.md.
---


# Write an ADR for {decision}
**Use when:** Michael Nygard template  -  preserve the why.
**What it does:** A Michael Nygard-style ADR so future-you (or a new hire) understands why the decision was made, not just what it was.
**Outcome:** An ADR at adrs/{YYYY-MM-DD}-{slug}.md that preserves the decision's context forever.
## Instructions
Run this as a user-facing action. Use the underlying `write-adr` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Write an Architecture Decision Record (ADR) for {decision}. Use the write-adr skill. Follow the Michael Nygard template: Title, Status (Proposed / Accepted / Deprecated / Superseded), Context, Decision, Consequences. Read context/engineering-context.md for stack. Keep it tight  -  one page, no padding. Save to adrs/{YYYY-MM-DD}-{slug}.md.
```
