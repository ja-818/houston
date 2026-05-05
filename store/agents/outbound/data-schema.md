# Outbound agent data schema

What lives at the agent root, what lives in `config/`, and what each
JSON index tracks. Every other skill in this agent reads these files
first; this doc is the contract.

## Layout

```
outbound/
├── CLAUDE.md
├── data-schema.md
├── houston.json
├── icon.png
├── outputs.json              # index of every artifact
├── leads.json                # every lead surfaced across runs
├── campaigns.json            # every Instantly campaign created
├── config/
│   └── context-ledger.json   # what I learned about you
├── runs/
│   └── {YYYY-MM-DD}-{post-slug}/
│       ├── scrape.json       # raw Apify output (deduped)
│       ├── contacts.json     # Apollo-enriched contacts ready for outreach
│       ├── airtable.md       # link to Airtable table + record counts
│       └── notes.md          # what happened in this run
└── sequences/
    └── {campaign-name}-sequence.md   # locked 3-email sequence ready for Instantly
```

## `config/context-ledger.json`

```jsonc
{
  "universal": {
    "company": {
      "name": "Acme Analytics",
      "pitch": "Free Slack analytics teardown for ops teams.",
      "stage": "seed",
      "sender": "Felipe"          // first name only, used in every email signature
    },
    "voice": {
      "samples": ["...3 short snippets in the founder's voice..."],
      "tone": "casual, no fluff, periods not em dashes"
    },
    "socialProof": [
      // each entry must include real numbers; I never invent
      {
        "client": "Northwind ops",
        "headline": "killed 38% of channels in a week",
        "context": "200-person company, ran the teardown last month"
      }
    ]
  },
  "domains": {
    "sources": {
      "apifyConnected": true,
      "commenterActor": "harvestapi/linkedin-post-comments",
      "reactionActor": "harvestapi/linkedin-post-reactions",
      "defaultMaxItems": 500       // tested at 500 for full-coverage scrapes
    },
    "enrichment": {
      "apolloConnected": true,
      "contactLabelTemplate": "LinkedIn {sourceType} - {author} Post"
    },
    "sending": {
      "instantlyConnected": true,
      "defaultTimezone": "America/Vancouver",   // accepted by Instantly, handles Pacific DST
      "defaultSchedule": {
        "weekdays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "windowStart": "08:00",
        "windowEnd": "17:00"
      },
      "sendingAccounts": "all"     // "all" attaches every connected sending account
    }
  }
}
```

The ledger is read first on every run. Missing required fields trigger
exactly one targeted question in chat, then I write the answer atomically
and continue. The ledger never asks the same question twice.

## `outputs.json`

Append-only index of every artifact this agent produces. Read-merge-
write atomically. One row per artifact:

```jsonc
{
  "id": "<uuid v4>",
  "type": "scrape | airtable-load | enrichment | sequence | campaign",
  "title": "LinkedIn commenters - Jane Doe RevOps post",
  "summary": "187 unique commenters scraped, deduped by profile URL.",
  "path": "runs/2026-05-05-jane-doe-revops/scrape.json",
  "status": "draft | ready | locked | paused",
  "domain": "sources | enrichment | sequence | sending",
  "createdAt": "<ISO>",
  "updatedAt": "<ISO>"
}
```

`status` reflects review state, not file existence:

- `draft`  -  artifact written, awaiting your review.
- `ready`  -  reviewed, ready for the next pipeline step.
- `locked`  -  sequences only, after every email is approved.
- `paused`  -  Instantly campaigns only, waiting for you to hit Activate.

## `leads.json`

Append-only index of every individual lead surfaced. Dedupe on
`profileUrl` across runs - the same person scraped from two posts
appears once.

```jsonc
{
  "id": "<uuid v4>",
  "fullName": "Jane Doe",
  "profileUrl": "https://www.linkedin.com/in/janedoe",
  "source": "linkedin-comment | linkedin-reaction",
  "sourcePostUrl": "https://www.linkedin.com/posts/...",
  "sourceAuthor": "Jane Doe",     // post author, not the lead
  "scrapedAt": "<ISO>",
  "email": "jane@northwind.example | null",
  "emailConfidence": "verified | guessed | null",
  "company": "Northwind",
  "title": "VP of Operations",
  "location": "San Francisco, CA",
  "enrichedAt": "<ISO> | null",
  "runId": "2026-05-05-jane-doe-revops",
  "loadedToCampaignId": "<instantly campaign id> | null"
}
```

## `campaigns.json`

Append-only index of every Instantly campaign created.

```jsonc
{
  "id": "<uuid v4>",
  "name": "LinkedIn - Jane Doe RevOps",
  "instantlyCampaignId": "<instantly id>",
  "sequenceFile": "sequences/jane-doe-revops-sequence.md",
  "leadCount": 92,
  "sendingAccounts": ["felipe@taxflow.example", "outreach@taxflow.example"],
  "schedule": {
    "timezone": "America/Vancouver",
    "weekdays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "windowStart": "08:00",
    "windowEnd": "17:00"
  },
  "status": "paused",            // I only ever write "paused"
  "createdAt": "<ISO>"
}
```

## Run folders (`runs/{date}-{slug}/`)

One folder per pipeline invocation. Naming: `{YYYY-MM-DD}-{post-slug}`.
Contents:

- `scrape.json`  -  raw Apify output after dedupe by `profileUrl`.
  Fields depend on actor (commenters get fewer fields than reactors).
- `contacts.json`  -  Apollo-enriched contacts that came back with a
  verified email. Drives the Instantly load. Rows without a verified
  email stay in Airtable but never land here.
- `airtable.md`  -  link to the Airtable table created in this run +
  record counts (loaded vs. failed).
- `notes.md`  -  per-run journal: which actor was used, `maxItems`,
  Apollo match rate, decisions you made during the sequence write.

## Sequences (`sequences/`)

One file per locked sequence: `{campaign-name}-sequence.md`. The file
holds all 3 emails (subject, body, day, signature), timing, and the
target lead-count comment. Format follows the James Shields rules
(see `cold-email-sequence`).

## What I never write

- Anywhere under `.houston/<agent-path>/`. Houston's file watcher
  skips that prefix; writing there breaks reactivity.
- Personal account credentials. API connections live in your Composio
  workspace; I read them by category at runtime, never persist secrets
  to disk.
- A row to `leads.json` without a `profileUrl`. The dedupe key has to
  exist.
- A row to `campaigns.json` with `status` other than `"paused"`. If you
  activate a campaign, that's your action - I don't track it.
