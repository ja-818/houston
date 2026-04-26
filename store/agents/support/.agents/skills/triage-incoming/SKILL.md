---
name: triage-incoming
description: "Use when a new inbound message arrives via your connected inbox (Gmail / Outlook / Intercom / Help Scout / Zendesk / Slack) and has not yet been triaged  -  I categorize it against the routing rules in `context/support-context.md`, assign priority from customer tier + content signals, VIP-flag, and write to `conversations.json` + `conversations/{id}/thread.json` so `draft-reply` can take over."
version: 1
tags: [support, triage, incoming]
category: Support
featured: yes
image: headphone
integrations: [gmail, outlook, slack]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Triage Incoming

## When to use
New inbound message landed, no `conversations.json` entry for thread yet, OR existing entry need re-triage because content changed (e.g. how-to turned outage report). Solo founder: triage constant  -  every fresh reply need this skill run first.

## Steps
0. **Read `context/support-context.md`.** If missing, stop. Tell me run `define-support-context` first. Read routing rules + SLA tiers + VIP list from doc  -  never hardcode.
1. **Identify source**  -  you name channel or message referenced by external id. Use `composio search <channel>` to find correct fetch slug (e.g. Gmail thread fetch, Intercom conversation fetch). Do NOT hardcode tool slugs.
2. **Fetch raw thread** via Composio. Pull subject, all messages, sender email, external message ids.
3. **Resolve customer.** Look up `customers.json` by sender email. If not found, create new index entry (slug = kebab-cased email local-part, deduped if needed).
4. **Categorize** content against routing categories in `context/support-context.md` (typical set: `bug | how-to | feature | billing | account | security | other`). Content signals: error messages + stack traces lean bug; "how do I…" lean how-to; "can you add…" lean feature; keywords "refund", "invoice", "charge" lean billing.
5. **Assign priority (P1–P4)** using tier thresholds from `context/support-context.md`. Typical start rules: MRR >= $500/mo → base P2; VIP tag → P1 floor. Escalate on content: "down", "can't log in", "data loss", "production" → bump one level (max P1). De-escalate on "whenever you get a chance".
6. **Set SLA fields** using `domains.inbox.slaTargets.firstResponseHours` (fallback to tier table in context doc). `breached = false` initially.
7. **Write atomically.** Upsert into `conversations.json`. Write full messages to `conversations/{id}/thread.json`.
8. **Append to `outputs.json`** with `type: "triage"`, `domain: "inbox"`, title = `{customer}  -  {subject}`, summary = category + priority, path.

## Outputs
- Writes to `conversations.json` (index upsert)
- Writes to `conversations/{id}/thread.json` (full thread)
- Writes to `customers.json` (new customer row if needed)
- Appends to `outputs.json` with `type: "triage"`, `domain: "inbox"`.