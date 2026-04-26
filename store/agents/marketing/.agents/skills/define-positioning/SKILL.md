---
name: define-positioning
description: "Use when you say 'help me with positioning' / 'draft my positioning'  -  I interview you briefly and write the full positioning doc (ICP, category, differentiators, brand voice, pricing stance, primary CTA) to `context/marketing-context.md`. I read this doc before every other skill I run  -  until it exists, they stop and ask for it."
version: 1
tags: [marketing, define, positioning]
category: Marketing
featured: yes
image: megaphone
integrations: [googledocs, notion]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Define Positioning

Head of Marketing OWNS `context/marketing-context.md`. No other agent
write it. This skill create or update. Its existence unblock other
four agents in workspace.

## When to use

- "help me write a positioning statement" / "draft my positioning" /
  "let's do positioning".
- "update the positioning doc" / "our ICP changed, fix the context
  doc".
- Called implicitly by any other skill needing positioning, finding
  doc missing  -  only after confirming with user.

## Steps

1. **Read config.** Load `config/company.json`, `config/icp.json`,
   `config/voice.md`. If any missing, run `onboard-me` first (or
   ask ONE missing piece just-in-time with best-modality hint:
   connected app > file > URL > paste).

2. **Read existing doc if present.** If
   `context/marketing-context.md` exist, read so this run = update,
   not rewrite. Preserve anything founder already sharpened; change
   only stale or new.

3. **Push for verbatim customer language.** Before drafting, ask
   founder for 2-3 verbatim customer quotes (pain they named, phrase
   used about category, objection heard). If `call-insights/` has
   entries, mine those first. No marketer-speak paraphrases  -  push
   back if founder start "translating" customer words.

4. **Draft doc (~300-500 words, opinionated, direct).** Structure,
   in order:

   1. **Company overview**  -  one paragraph: what we make, who for,
      what make it worth building now.
   2. **ICP**  -  industry, size, role, triggers. Name **1-2 anchor
      accounts** (real closed-won or target).
   3. **Jobs-to-be-done**  -  2-3 real jobs buyer hire product for.
      Verbatim customer language preferred.
   4. **Positioning statement**  -  one-sentence category + audience +
      differentiated value. Opinionated.
   5. **Category & differentiators**  -  category we play in + 3
      things actually set us apart (not "we're faster").
   6. **Top 3 competitors**  -  named, one-line "they're strong at X,
      we're strong at Y" each.
   7. **Brand voice notes**  -  4-6 bullets on tone, forbidden
      phrases, sentence-length preference. Pull from
      `config/voice.md`.
   8. **Pricing stance**  -  model + current range + one thing NOT
      negotiable.
   9. **Primary CTA**  -  one action every page / email / campaign
      push toward right now.

5. **Mark gaps honestly.** If section thin (no customer quotes yet,
   no anchor account), write `TBD  -  {what the founder should
   bring next}` instead of guessing. Never invent.

6. **Write atomically.** Write to
   `context/marketing-context.md.tmp`, then rename to
   `context/marketing-context.md`. Single file at agent root. NOT
   under subfolder. NOT under `.agents/`. NOT under
   `.houston/<agent>/`.

7. **Append to `outputs.json`.** Read existing array, append new
   entry, write atomically:

   ```json
   {
     "id": "<uuid v4>",
     "type": "positioning",
     "title": "Positioning doc updated",
     "summary": "<2-3 sentences  -  the positioning statement + what changed this pass>",
     "path": "context/marketing-context.md",
     "status": "draft",
     "createdAt": "<ISO-8601>",
     "updatedAt": "<ISO-8601>"
   }
   ```

   (Doc itself live file, but each substantive edit indexed so
   founder see update on dashboard.)

8. **Summarize to user.** One paragraph: what changed, what still
   `TBD`, exact next move (e.g. "paste 3 customer quotes and I'll
   tighten JTBD"). Remind them other four agents now have context
   they need.

## Outputs

- `context/marketing-context.md` (at agent root  -  live document)
- Appends to `outputs.json` with `type: "positioning"`.