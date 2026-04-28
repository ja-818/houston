---
name: build-the-keyword-map-you-can-actually-own
description: "I cluster keywords by intent and difficulty via Semrush (or Ahrefs). Flag the 3 pillars worth owning. Draft cluster briefs. No vanity keyword dumps."
version: 1
tags: ["marketing", "overview-action", "research-keywords"]
category: "SEO"
featured: yes
integrations: ["semrush", "ahrefs"]
image: "megaphone"
---


# Build the keyword map you can actually own
**Use when:** Clusters by intent × difficulty. Top 3 pillars.
**What it does:** I cluster keywords by intent and difficulty via Semrush (or Ahrefs). Flag the 3 pillars worth owning. Draft cluster briefs. No vanity keyword dumps.
**Outcome:** Living keyword-map.md + per-cluster briefs at keyword-clusters/{slug}.md.
## Instructions
Run this as a user-facing action. Use the underlying `research-keywords` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run keyword research with Semrush for {topic}. Use the research-keywords skill. Cluster by intent and difficulty, flag the 3 pillars worth owning (not the top 50), and draft cluster briefs. Maintain the living keyword-map.md and per-cluster detail at keyword-clusters/{slug}.md.
```
