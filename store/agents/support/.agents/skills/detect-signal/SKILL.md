---
name: detect-signal
description: "Use when a message looks like a bug / feature ask / repeat question  -  I extract the `signal` you name: `bug` (repro + severity, writes `bug-candidates.json`) · `feature-request` (ask + requesting-customer slug, writes `requests.json`) · `repeat-question` (cluster ≥3 similar asks without a matching KB article, writes `patterns.json`). Chains to `write-article type=from-ticket` for repeat-question hits."
version: 1
tags: [support, detect, signal]
category: Support
featured: yes
image: headphone
integrations: [gmail, github, linear, jira]
---


# Detect Signal

One skill for every "thread contain signal to file" ask. Branch on `signal`.

## When to use

- **bug**  -  "is this bug? log it" / message contain error messages, stack traces, "used to work, now doesn't," repro steps, or screenshots of broken UI.
- **feature-request**  -  conversation or DM contain feature ask ("can you add X?", "would be great if Y").
- **repeat-question**  -  on weekly cron, or when scan last 30–60 days and cluster of semantically similar incoming questions hit ≥3 with no matching article.

## Ledger fields I read

- `universal.positioning`  -  product surface (in-scope vs out-of-scope).
- `domains.inbox.routingCategories`  -  bug / feature-request classification rules.
- `domains.help-center.platform`  -  check existing KB coverage before flagging repeat-question cluster.

If required field missing, ask ONE targeted question, write, continue.

## Parameter: `signal`

- `bug`  -  extract repro steps, affected version, affected customer. Assign severity per `context/support-context.md#severity`. Append to `bug-candidates.json`. Offer chain to connected tracker (GitHub / Linear / Jira via Composio).
- `feature-request`  -  extract ask + requesting-customer slug. Append / merge in `requests.json`. If merging, increment requester count; if VIP, flag.
- `repeat-question`  -  scan last 30–60 days of `conversations.json`. Cluster semantically similar incoming questions. For each cluster ≥3 without matching article, append to `patterns.json` and surface as docs gap.

## Steps

1. **Read `context/support-context.md`.** If missing, stop.
2. **Read ledger.** Fill gaps.
3. **Branch on `signal`:**
   - `bug`: read source `conversations/{id}/thread.json`. Extract repro (numbered steps), affected version, error message / stack trace. Assign severity. Write new entry to `bug-candidates.json` (read-merge-write) with `{id, title, severity, affectedCustomers, reproSteps, sourceConversationId, status: "new"}`. If told, chain to connected tracker by calling its create-issue tool.
   - `feature-request`: read source message. Extract ask in single sentence. Look for near-duplicates in `requests.json`; if found, append customer slug and increment. If new, create entry. Never attribute request to customer who didn't make it.
   - `repeat-question`: read `conversations.json` last 30–60 days. Cluster by topic / first-line similarity. For each cluster ≥3, check `articles/` for existing answer. If none, append new pattern to `patterns.json` with `{cluster, exampleIds, count, suggestedTitle}`. Offer chain `write-article type=from-ticket` for top pick.
4. **Append to `outputs.json`** with `type` = `bug-candidate` | `feature-request` | `repeat-question`, `domain: "inbox"` (bug / feature-request) or `domain: "help-center"` (repeat-question), title, summary, path.
5. **Summarize to me**: what filed + where + recommended next chain.

## Outputs

- `bug-candidates.json` entry (for `signal = bug`)
- `requests.json` entry (for `signal = feature-request`)
- `patterns.json` entry (for `signal = repeat-question`)
- Appends to `outputs.json`.

## What I never do

- File bug in connected tracker without your approval. Draft issue; you create.
- Attribute feature request to customer who didn't ask.
- Flag repeat-question cluster that already has article  -  check `articles/` first.