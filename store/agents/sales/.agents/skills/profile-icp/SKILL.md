---
name: profile-icp
description: "Use when you say 'profile the buying committee for {segment}' / 'who signs at {segment}' / 'build a persona for sales'  -  I pull top closed-won accounts from your connected CRM (HubSpot / Salesforce / Attio / Pipedrive / Close) and synthesize a sales-flavored persona covering champion, economic buyer, blocker, disqualifiers, and anchor accounts. Writes to `personas/{segment-slug}.md`."
version: 1
tags: [sales, profile, icp]
category: Sales
featured: yes
image: handshake
integrations: [hubspot, salesforce, attio, pipedrive]
---


# Profile ICP (Sales)

Skill narrower than marketing persona. Goal: answer "who we sell to, who signs, who blocks, what triggers decision"  -  4 things agent + AE need to tune outreach + discovery.

## When to use

- "profile the buying committee for {segment}".
- "who signs at {segment}" / "who actually buys us".
- "build a sales persona for {segment}".
- Called by `define-sales-playbook` when buying-committee section thin.

## Steps

1. **Read playbook.** Load `context/sales-context.md`. If missing, run `define-sales-playbook` first.

2. **Source accounts.** Ask user: "Should I pull closed-won accounts in {segment} from your connected CRM, or work from examples you give me?" CRM route: `composio search crm` → pull top ~20 closed-won in segment. Example route: ask for 2–3 real accounts closed (or best-fit target accounts).

3. **Extract per-account.** For each account: firmographics (size, region, industry, stage), champion title + motivations, who signed contract, who pushed back or delayed, what triggered search, time-to-close, primary use case. Cite source (CRM record or founder description).

4. **Synthesize across accounts.** Write:
   - **Champion**  -  title patterns, pains named, motivations, what's in it for them when deal closes.
   - **Economic buyer**  -  title patterns (often different from champion), what wins them (ROI, risk mitigation, status quo disruption, competitive parity), what they kill deals over.
   - **Blocker**  -  seat that most often kills deals in {segment} (often IT, legal, procurement, or counter-incumbent champion). How to neutralize.
   - **Influencers**  -  other seats needed on bus.
   - **Disqualifiers**  -  3 hard nos for {segment} specifically (if different from global playbook).
   - **Buying triggers**  -  concrete signals they starting search now (hiring pattern, funding, stack change, incident, regulatory deadline).

5. **Mark gaps honestly.** `TBD  -  need 2 more closed-won in segment` not guess.

6. **Write atomically.** Write to `personas/{segment-slug}.md.tmp`, then rename. Cite every claim.

7. **Append to `outputs.json`:**

   ```json
   {
     "id": "<uuid v4>",
     "type": "persona",
     "title": "Buying committee  -  {segment}",
     "summary": "<2–3 sentences  -  champion / EB / blocker pattern>",
     "path": "personas/{segment-slug}.md",
     "status": "draft",
     "createdAt": "<ISO>",
     "updatedAt": "<ISO>"
   }
   ```

8. **Summarize to user.** One paragraph + path. Flag which playbook sections persona updates (buying committee, disqualifiers, triggers) + whether recommend running `define-sales-playbook` next to fold in.

## Outputs

- `personas/{segment-slug}.md`
- Appends to `outputs.json` with `type: "persona"`.