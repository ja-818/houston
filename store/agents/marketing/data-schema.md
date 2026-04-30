# Marketing  -  Data Schema

All records share these base fields:

```ts
interface BaseRecord {
  id: string;          // UUID v4
  createdAt: string;   // ISO-8601 UTC
  updatedAt: string;   // ISO-8601 UTC
}
```

All writes are atomic: write `*.tmp`, then rename onto the target
path. Never edit in-place. **Never write anywhere under
`.houston/<agent-path>/`**  -  the Houston file watcher
(`crates/houston-tauri/src/agent_watcher.rs`) skips that prefix and
dashboard reactivity breaks.

---

## `config/`  -  the context ledger

Nothing under `config/` is shipped in the repo. Every field appears
at runtime, written by the first skill that needs it. This is
"what I've learned about the user"  -  not "what I've produced for
them."

### `config/context-ledger.json`

Single living file that every skill reads first. Shape:

```ts
interface ContextLedger {
  universal: {
    company?: {
      name: string;
      website?: string;
      pitch30s?: string;
      stage?: "idea" | "mvp" | "early" | "growth" | "scale";
      source: "paste" | "url" | "file" | "connected-app";
      capturedAt: string;
    };
    voice?: {
      summary: string;            // short tone summary
      sampleSource: "inbox-composio" | "paste" | "social-posts";
      sampleCount: number;        // e.g. 20-30 recent sent messages
      capturedAt: string;
    };
    positioning?: {
      present: boolean;
      path: "context/marketing-context.md";
      lastUpdatedAt?: string;
    };
    idealCustomer?: {
      industry: string[];
      roles: string[];
      pains: string[];
      triggers: string[];
      source: "paste" | "url" | "connected-crm";
      capturedAt: string;
    };
  };
  domains: {
    seo?: {
      domain: string;             // e.g. "acme.com"
      tooling: ("semrush" | "ahrefs" | "firecrawl" | "other")[];
      capturedAt: string;
    };
    email?: {
      platform: "customerio" | "loops" | "mailchimp" | "kit" | "beehiiv" | "resend" | "other";
      journey?: {
        signup: string;           // event name
        activation: string;       // event name
        aha?: string;
        habit?: string;
      };
      capturedAt: string;
    };
    social?: {
      platforms: ("linkedin" | "twitter" | "reddit" | "instagram" | "tiktok")[];
      topics: string[];           // 3-5 POV themes
      capturedAt: string;
    };
    paid?: {
      channels: ("googleads" | "metaads" | "linkedin" | "reddit" | "other")[];
      analytics: "ga4" | "posthog" | "mixpanel" | "amplitude" | "other";
      primaryConversion: string;  // event name
      capturedAt: string;
    };
    copy?: {
      primaryPage: string;        // e.g. "homepage" or URL
      primaryConversion: string;  // same semantic as paid.primaryConversion
      leakiestSurface?: "signup-flow" | "paywall" | "popup" | "onboarding" | "form" | "other";
      capturedAt: string;
    };
  };
}
```

**Capture rule.** Every skill declares in its body which ledger
fields it needs. Before doing work, it reads the ledger; for any
missing field it asks ONE targeted question with a modality hint,
writes the field atomically, and continues. Never asks the same
field twice.

### `config/voice.md`

Markdown. 3-5 verbatim samples of the user's writing plus a short
tone-notes block (greeting habits, closing habits, sentence length,
formality, quirks). Written by the first skill that drafts copy /
content / emails.

---

## `context/`  -  living documents owned by this agent

### `context/marketing-context.md`

The positioning doc. **Every skill reads this before it writes any
copy, content, or campaign.** Owned and updated exclusively by
`set-up-my-marketing-info`.

Structure (filled in by `set-up-my-marketing-info`):

- Company overview (name, site, 30s pitch, stage).
- Ideal customer (industry, roles, pains, JTBD, triggers, anchor accounts).
- Positioning statement.
- Category & differentiators.
- Brand voice notes.
- Top 3 competitors.
- Pricing stance.
- Primary CTA.

Not indexed in `outputs.json`  -  it's a live document, not a
deliverable.

---

## Domain data  -  what the agent produces

Flat folders at the agent root. One `outputs.json` index at the
root spans every folder  -  there's no per-domain sub-index.

### `outputs.json`  -  the single index

```ts
interface OutputRow extends BaseRecord {
  type:
    | "positioning" | "persona" | "competitor-brief" | "research"
    | "call-insight" | "analysis"
    | "seo-audit" | "keyword-map" | "blog-post" | "case-study"
    | "repurposed" | "backlink-plan" | "ai-search-audit"
    | "campaign" | "ad-copy" | "ab-test" | "tracking-plan"
    | "linkedin-post" | "x-thread" | "newsletter" | "community-reply"
    | "social-calendar" | "feed-digest" | "linkedin-digest" | "podcast-pitch"
    | "page-copy" | "copy-edit" | "headline-variants" | "cta-variants"
    | "audit";
  title: string;
  summary: string;              // 2-3 sentences  -  what this doc concludes
  path: string;                 // relative to agent root
  status: "draft" | "ready";
  domain: "positioning" | "seo" | "email" | "social" | "paid" | "copy";
}
```

Rules:

- Mark `draft` while iterating. Flip to `ready` after user sign-off.
- On update: refresh `updatedAt`, **never** touch `createdAt`.
- **Never** overwrite the whole array  -  read, merge, write.

### Artifact folders (all at agent root)

| Folder | Written by | Notes |
|---|---|---|
| `personas/{slug}.md` | `profile-my-customer` | One per ideal customer segment. |
| `competitor-briefs/{source}-{slug}.md` | `watch-my-competitors` | `source` = `product` / `ads` / `social-feed`. |
| `research/{slug}.md` | `research-a-topic` | Deep-research briefs. |
| `call-insights/{YYYY-MM-DD}.md` | `mine-my-sales-calls` | Batch per session. |
| `analyses/{subject}-{YYYY-MM-DD}.md` | `check-my-marketing` | `subject` = `funnel` / `content-gap` / `marketing-health`. |
| `audits/{surface}-{slug}-{YYYY-MM-DD}.md` | `audit-a-surface` | `surface` = `site-seo` / `ai-search` / `landing-page` / `form`. |
| `keyword-map.md` + `keyword-clusters/{slug}.md` | `research-my-seo` (focus=keywords) | Living index + per-cluster detail. |
| `blog-posts/{slug}.md` | `write-a-post` (channel=blog) | Optional Google Doc mirror. |
| `case-studies/{customer-slug}.md` | `write-a-case-study` | |
| `repurposed/{source}-to-{target}.md` | `repurpose-my-content` | |
| `backlink-plans/{YYYY-MM-DD}.md` | `research-my-seo` (focus=backlinks) | |
| `campaigns/{type}-{slug}.md` | `plan-a-campaign` | `type` = `paid` / `launch` / `lifecycle-drip` / `welcome` / `churn-save` / `announcement`. |
| `ad-copy/{campaign-slug}.md` | `write-copy-variants` (job=ad-copy) | |
| `ab-tests/{slug}.md` | `measure-my-marketing` (scope=ab-test) | |
| `tracking-plans/{slug}.md` | `measure-my-marketing` (scope=tracking-plan) | |
| `posts/linkedin-{slug}.md` | `write-a-post` (channel=linkedin) | |
| `threads/x-{slug}.md` | `write-a-post` (channel=x-thread) | |
| `newsletters/{YYYY-MM-DD}.md` | `write-a-post` (channel=newsletter) | |
| `community-replies/{source-slug}.md` | `write-a-post` (channel=reddit) | |
| `social-calendars/{YYYY-WNN}.md` + `social-calendar.md` | `plan-my-social-week` | Living doc + per-week detail. |
| `feed-digests/{platform}-{YYYY-MM-DD}.md` | `watch-my-competitors` (source=social-feed) | |
| `linkedin-digests/{YYYY-MM-DD}.md` | `measure-my-marketing` (scope=linkedin-digest) | |
| `podcast-pitches/{YYYY-MM-DD}.md` | `pitch-me-on-podcasts` | |
| `page-copy/{surface}-{slug}.md` | `write-my-page-copy` | `surface` = `homepage` / `pricing` / `about` / `landing` / `signup-flow` / `onboarding` / `paywall` / `popup`. |
| `copy-edits/{slug}.md` | `write-copy-variants` (job=edit) | |
| `headline-variants/{page-slug}.md` | `write-copy-variants` (job=headlines) | |
| `cta-variants/{page-slug}.md` | `write-copy-variants` (job=ctas) | |

---

## No cross-agent reads

This agent is self-contained. Unlike the 6-agent `founder-marketing-
workspace` sibling, there are no `../{other-agent}/...` paths
anywhere in this agent's skills. Everything lives under this
folder.
