---
name: weekly-pr-health-cycle-time-size-reviewer-load
description: "Five metrics from the last 7 days: PRs merged, median cycle time, largest PR size, reviewer concentration, open-to-merge age. One-line diagnosis per anomaly."
version: 1
tags: ["engineering", "overview-action", "analyze"]
category: "Development"
featured: yes
integrations: ["github", "gitlab", "firecrawl", "perplexityai"]
image: "laptop"
---


# Weekly PR health  -  cycle time, size, reviewer load
**Use when:** DORA-lite readout  -  5 metrics + one-line diagnoses.
**What it does:** Five metrics from the last 7 days: PRs merged, median cycle time, largest PR size, reviewer concentration, open-to-merge age. One-line diagnosis per anomaly.
**Outcome:** A one-pager at pr-velocity/{YYYY-Www}.md with the five metrics + one-line diagnoses.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run the weekly PR health readout. Use the analyze skill with subject=pr-velocity. Pull the last 7 days of PRs from my connected GitHub / GitLab. Compute: PRs merged, median cycle time (open → merge), largest PR size in lines changed, reviewer concentration (top-reviewer share), open-to-merge age of currently-open PRs. Read context/engineering-context.md so the diagnosis respects quality bar + cadence. Save to pr-velocity/{YYYY-Www}.md with a one-line diagnosis per anomaly.
```
