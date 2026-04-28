---
name: rank-tech-debt-by-impact-effort
description: "I maintain a single running tech-debt.md at the agent root: area, problem, impact (1-5), effort (S/M/L/XL), suggested next step per entry. Read-merge-write, never overwrite."
version: 1
tags: ["engineering", "overview-action", "triage-tech-debt"]
category: "Triage"
featured: yes
integrations: ["github", "gitlab"]
image: "laptop"
---


# Rank tech debt by impact × effort
**Use when:** One living list. Read-merge-write, never overwrite.
**What it does:** I maintain a single running tech-debt.md at the agent root: area, problem, impact (1-5), effort (S/M/L/XL), suggested next step per entry. Read-merge-write, never overwrite.
**Outcome:** A sorted tech-debt.md with the top 3 debts to attack next week called out in chat.
## Instructions
Run this as a user-facing action. Use the underlying `triage-tech-debt` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Refresh the tech-debt inventory. Use the triage-tech-debt skill. Read context/engineering-context.md so impact scoring respects the actual stack and priorities. Read existing tech-debt.md at the agent root if it exists  -  merge new findings in, never wholesale-overwrite. Each entry: area, problem, impact (1-5), effort (S/M/L/XL), suggested next step. Sort by impact / effort. End with the top 3 to attack next week.
```
