# Simplified Verticals

A Houston workspace of **full-stack single-agent verticals**. One
agent per vertical, covering the surface area of a whole team —
without the cross-agent handoffs.

This is the counterpart to the multi-agent founder workspaces
(`founder-sales-workspace/`, `founder-marketing-workspace/`). Those
give you a team with a shared source-of-truth doc and routing rules.
**This workspace gives you one agent per vertical with all the
skills collapsed behind one conversation.**

Use this workspace when:

- You want one agent to talk to, not six.
- You don't want to juggle which agent does what.
- You prefer an agent that asks for what it needs just-in-time rather
  than an 18-question upfront onboarding across a team.

---

## The agents

| Agent | Hired to… | Domains covered | Good first prompt |
|-------|-----------|-----------------|-------------------|
| **Marketing** | Full-stack marketing operator | Positioning · SEO & content · email & lifecycle · social · paid & growth · conversion copy | "Help me write my positioning statement" |
| **Sales** | Full-stack sales operator | Playbook · outbound · inbound · meetings · CRM · retention | "Draft a cold email to this prospect" |
| **Engineering** | Full-stack engineering operator | Planning · triage · development · reliability · docs | "Triage today's backlog" |
| **People** | Full-stack people/HR operator | Hiring · onboarding · performance · compliance · culture | "Screen this resume against the role" |
| **Legal** | Full-stack legal operator | Contracts · compliance · entity · IP · advisory | "Review this NDA and flag the risks" |
| **Operations** | Full-stack operations operator | Planning · scheduling · finance · vendors · data | "Prep me for this morning's meetings" |
| **Support** | Full-stack customer support operator | Inbox · help center · success · quality | "Triage my support inbox this morning" |
| **Bookkeeping** | Full-stack startup bookkeeper | Setup · transactions · close · reporting · compliance | "Process these bank statements" |

---

## Install

**Via Houston:**

1. Open Houston.
2. **Settings → Add workspace from GitHub**.
3. Paste this repository's URL.
4. Houston installs every agent in this workspace at once.

**On first open of any agent:** no upfront onboarding. Click any
tile on the Overview tab — the agent gets to work and asks for what
it needs inline (best modality first: Composio connection from the
Integrations tab > file drop > URL > paste).

---

## What makes these "simplified"

Compared to the multi-agent founder workspaces:

| Dimension | Multi-agent (`founder-marketing-workspace`) | Simplified (this workspace) |
|---|---|---|
| Agents per vertical | 6 | 1 |
| Upfront onboarding | 3 questions per agent | None — asks just-in-time |
| Positioning / voice | Shared file read across agents | Local to the single agent |
| Routing | Each agent's skill list + "which agent?" | One CLAUDE.md grouped by domain |
| Skills | ~50 narrow skills | ~25 consolidated (5 use a parameter) |
| Overview | Per-agent tile grid | One tile grid with domain filter chips |

**Output quality is the same.** The consolidation is behind the
user — each skill still produces the same markdown artifacts to the
same folder patterns, just now everything lives under one agent root.

---

## Conventions

Every agent in this workspace:

- **Is a full-stack operator for its vertical.** No cross-agent reads;
  no "talk to the positioning agent first."
- **Is chat-first.** Overview tab is a tile grid that fires chat
  messages. All real work starts with a conversation.
- **Writes markdown outputs.** Everything the agent produces is a
  markdown file in a flat folder at the agent root.
- **Uses Composio as the only external transport.** Connected
  accounts are discovered at runtime via `composio search <category>`
  — no hardcoded tool names. If a connection is missing, the agent
  tells you which category to link and stops.
- **Never publishes without approval.** Drafts only. You ship.

---

## Structure

```
simplified-verticals/
├── workspace.json          # bundle manifest
├── README.md               # this file
├── .gitignore
└── agents/
    ├── marketing/          # 23 skills across 6 domain chips
    ├── sales/              # 18 skills across 6 domain chips
    ├── engineering/        # 22 skills across 5 domain chips
    ├── people/             # 17 skills across 5 domain chips
    ├── legal/              # 12 skills across 5 domain chips
    ├── operations/         # 23 skills across 5 domain chips
    ├── support/            # 16 skills across 4 domain chips
    └── bookkeeping/        # 20 skills across 5 domain chips
        ├── houston.json        # includes useCases for the tile grid
        ├── CLAUDE.md           # identity + domain-grouped skill index
        ├── data-schema.md      # context ledger + artifact folders
        ├── bundle.js           # Overview tiles with filter chips
        ├── icon.png
        └── .agents/skills/     # ports + consolidated skills
```
