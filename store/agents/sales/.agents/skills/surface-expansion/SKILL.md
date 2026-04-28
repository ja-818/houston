---
name: surface-expansion
description: "Use when you say 'any expansion opportunities in my book' / 'who's ripe for upsell'  -  I scan your GREEN customers for usage spikes (via connected PostHog / Mixpanel), team-growth signal, and feature-request patterns, then rank opportunities by ARR upside with the cited signal per row. Writes to `expansion/{YYYY-MM-DD}.md`."
version: 1
tags: [sales, surface, expansion]
category: Sales
featured: yes
image: handshake
integrations: [linkedin]
---


# Surface Expansion

## When to use

- "any expansion opportunities in my book right now".
- "who's ripe for upsell / cross-sell".
- Scheduled: monthly expansion sweep.

## Steps

1. **Read playbook.** `context/sales-context.md` for pricing stance + SKU list.

2. **Read `customers.json`.** Filter to `health: "GREEN"` only.

3. **Per GREEN customer, check signals:**
   - **Usage spikes**  -  past current tier threshold (query product-analytics).
   - **Team-size growth**  -  new seats, LinkedIn headcount growth (query CRM + LinkedIn if connected).
   - **Feature requests**  -  from tickets mapping to existing SKU (query support).
   - **New-product adoption**  -  % using newest feature / SKU.

4. **Score candidate.** ARR impact (low / med / high) × effort-to-close (low / med / high). Rank by impact/effort ratio.

5. **High-signal candidates, write per-customer brief:** `customers/{slug}/expansion-{YYYY-MM-DD}.md`  -  cited signal, proposed SKU / seat / tier, estimated ARR, effort-to-close, one-line pitch agent would use.

6. **Append to `expansion.json`:**

   ```ts
   {
     id, slug, customerSlug,
     type: "upsell" | "cross-sell" | "add-on" | "seat-expansion",
     estArr, effort: "low"|"med"|"high",
     signal: "<cited signal>",
     status: "surfaced",
     createdAt, updatedAt
   }
   ```

7. **Update `customers.json`**  -  increment `openExpansions`.

8. **Append to `outputs.json`** with `type: "expansion"`.

9. **Summarize.** Top 3 opportunities (customer · type · est ARR). Suggest handoff: "Run `@ae draft-proposal` on top one."

## Outputs

- `customers/{slug}/expansion-{YYYY-MM-DD}.md` per candidate.
- Appends to `expansion.json`.
- Appends to `outputs.json`.