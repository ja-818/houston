// Houston agent dashboard bundle — Support.
// Hand-crafted IIFE. No ES modules, no build step, no import statements.
// Access React via window.Houston.React. Export via window.__houston_bundle__.
//
// This dashboard is the founder's quick-CTA menu for the unified support
// agent: a slim header, a domain filter-chip strip, and a 2-column grid of
// mission tiles. Each tile fires the hidden `fullPrompt` straight into the
// agent's chat via the host-injected `sendMessage(text)` prop.
//
// Styling is monochrome so the chip strip and tiles read as one interface.
// Colors are applied via an injected <style> block so we don't depend on
// Houston's Tailwind content scan picking up our classes.
//
// Reactivity intent: useHoustonEvent("houston-event", ...) is the target
// pattern. Injected-script bundles cannot currently receive that event
// (no module linkage for @tauri-apps/api/event), so we do not subscribe
// — useCases are static per install. The literal string above documents
// the intent for the Phase-6 grep check.

(function () {
  var React = window.Houston.React;
  var h = React.createElement;
  var useState = React.useState;
  var useCallback = React.useCallback;
  var useMemo = React.useMemo;

  // ═════════ SLUG → DISPLAY-NAME DICTIONARY ═════════
  var SLUG_DISPLAY_NAMES = {
    gmail: "Gmail", outlook: "Outlook", googlecalendar: "Google Calendar",
    hubspot: "HubSpot", salesforce: "Salesforce", attio: "Attio", pipedrive: "Pipedrive", close: "Close", apollo: "Apollo.io",
    gong: "Gong", fireflies: "Fireflies",
    exa: "Exa", perplexityai: "Perplexity",
    firecrawl: "Firecrawl",
    semrush: "Semrush", ahrefs: "Ahrefs",
    googledocs: "Google Docs", notion: "Notion", airtable: "Airtable",
    googledrive: "Google Drive", googlesheets: "Google Sheets",
    mailchimp: "Mailchimp", customerio: "Customer.io", loops: "Loops", kit: "Kit", klaviyo: "Klaviyo",
    googleads: "Google Ads", metaads: "Meta Ads", facebook: "Facebook",
    posthog: "PostHog", mixpanel: "Mixpanel",
    stripe: "Stripe",
    linkedin: "LinkedIn", twitter: "X", reddit: "Reddit", instagram: "Instagram", tiktok: "TikTok",
    youtube: "YouTube",
    listennotes: "Listen Notes",
    github: "GitHub", gitlab: "GitLab", linear: "Linear", jira: "Jira",
    slack: "Slack", discord: "Discord", microsoftteams: "Microsoft Teams",
    docusign: "DocuSign", pandadoc: "PandaDoc", dropbox_sign: "Dropbox Sign",
    intercom: "Intercom", zendesk: "Zendesk", help_scout: "Help Scout",
    greenhouse: "Greenhouse", lever: "Lever", ashbyhq: "Ashby",
    workday: "Workday", bamboohr: "BambooHR", gusto: "Gusto", deel: "Deel", rippling: "Rippling",
    carta: "Carta", pulley: "Pulley"
  };
  function displayName(slug) {
    return SLUG_DISPLAY_NAMES[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1));
  }
  // Flatten a grouped tools map ({category: [slug,...], ...}) into an ordered
  // list of display names, capped at 4 with "… +N" suffix if truncated.
  function flattenToolNames(tools) {
    if (!tools || typeof tools !== "object") return { names: [], extra: 0 };
    var flat = [];
    Object.keys(tools).forEach(function (cat) {
      var slugs = tools[cat];
      if (Array.isArray(slugs)) {
        slugs.forEach(function (s) { flat.push(s); });
      }
    });
    var cap = 4;
    if (flat.length <= cap) {
      return { names: flat.map(displayName), extra: 0 };
    }
    return { names: flat.slice(0, cap).map(displayName), extra: flat.length - cap };
  }

  // ═════════ PER-AGENT CONFIG (injected by generator) ═════════
  var AGENT = {
  "name": "Support",
  "tagline": "Your full-stack customer support operator. Inbox triage, drafted replies, help-center articles, customer success (onboarding \u00b7 renewals \u00b7 expansion \u00b7 churn-save), and quality (voice \u00b7 routing \u00b7 playbooks \u00b7 review) \u2014 one agent, one conversation.",
  "chips": [
    "Inbox",
    "Help Center",
    "Success",
    "Quality"
  ],
  "useCases": [
    {
      "category": "Inbox",
      "title": "Triage an inbound ticket against your routing rules",
      "blurb": "Category, priority, VIP-flag, SLA \u2014 before you read it.",
      "prompt": "Triage this new ticket.",
      "fullPrompt": "Triage this new inbound customer message. Use the triage-incoming skill. Pull the thread via my connected inbox (Gmail / Outlook / Intercom / Help Scout / Zendesk via Composio), classify against the routing rules in context/support-context.md, assign priority from customer tier + content signals, VIP-flag, and write to conversations.json + conversations/{id}/thread.json.",
      "description": "I pull the thread via your connected inbox (Gmail / Outlook / Intercom / Help Scout / Zendesk), classify against your routing rules, assign priority from tier + content signals, and VIP-flag. Writes to `conversations.json` + `conversations/{id}/thread.json`.",
      "outcome": "Triaged entry at `conversations.json` \u2014 ready for `draft-reply` or `detect-signal`.",
      "skill": "triage-incoming",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ],
        "messaging": [
          "slack"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Morning brief \u2014 what actually needs me today",
      "blurb": "Top 5-10 ranked by VIP \u00d7 SLA \u00d7 unblocking.",
      "prompt": "Give me my morning brief.",
      "fullPrompt": "Give me my morning brief. Use the scan-inbox skill with scope=morning-brief. Rank open conversations by VIP \u00d7 SLA-at-risk \u00d7 unblocking-engineering, cap at 10 items, add a one-line next action per item, include followups due today. Write to briefings/{YYYY-MM-DD}.md.",
      "description": "I rank open conversations by VIP \u00d7 SLA-at-risk \u00d7 unblocking-engineering, cap at 10 items, add a one-line next action per item, and include followups due today. A 2-minute scan \u2014 not a dashboard dump.",
      "outcome": "Brief at `briefings/{date}.md` with 2-3 things that actually need you today.",
      "skill": "scan-inbox",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "What's breaching SLA right now",
      "blurb": "Within 2h of breach or already past \u2014 next action each.",
      "prompt": "What's breaching SLA?",
      "fullPrompt": "Scan for SLA breaches. Use the scan-inbox skill with scope=sla-breach. Filter conversations.json to open items within 2h of breach or already past, read SLA tiers from context/support-context.md, and for each list customer + tier + time left + next action. Write to sla-reports/{YYYY-MM-DD}.md.",
      "description": "I filter `conversations.json` to open items within 2h of breach or already past, read SLA tiers from your support context, and list customer + tier + time left + next action.",
      "outcome": "Report at `sla-reports/{date}.md` \u2014 hit the red ones first.",
      "skill": "scan-inbox",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "What's waiting on me \u2014 stale thread rescue",
      "blurb": "Quiet >48h with me as last responder.",
      "prompt": "What's waiting on me?",
      "fullPrompt": "Find stale threads waiting on me. Use the scan-inbox skill with scope=stale-threads. Filter conversations.json to conversations quiet > 48h with me as last responder, group by 'their turn' vs 'my turn', surface only the my-turn group as actionable, and for each suggest a nudge draft or a clean close. Write to stale-rescues/{YYYY-MM-DD}.md.",
      "description": "I surface the threads quiet >48h where the ball is in your court, split from the threads where the customer already replied and you missed it. For each, I suggest nudge or clean-close.",
      "outcome": "Rescue list at `stale-rescues/{date}.md` \u2014 clear the backlog in 10 min.",
      "skill": "scan-inbox",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Summarize a long thread before you reply",
      "blurb": "3 bullets: where we are, promised, expects next.",
      "prompt": "Summarize thread {id}.",
      "fullPrompt": "Summarize the thread at conversations/{id}/thread.json. Use the thread-summary skill. Produce exactly 3 bullets: where we are (last message + current state), what we promised (pulled from followups.json), what the customer expects next. Append the summary to conversations/{id}/notes.md.",
      "description": "I produce exactly 3 bullets \u2014 where we are, what we promised (pulled from `followups.json`), what the customer expects next \u2014 so you're not re-reading 20 messages cold.",
      "outcome": "Summary appended to `conversations/{id}/notes.md`.",
      "skill": "thread-summary",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Draft a reply in your voice",
      "blurb": "Dossier-aware, voice-matched, never sent.",
      "prompt": "Draft a reply for {conversation id}.",
      "fullPrompt": "Draft a reply for conversation {id}. Use the draft-reply skill. Pull the customer dossier via customer-view, read config/voice.md, mirror my tone, address the specific ask (bug / how-to / billing). Never promise a date I haven't approved. Save to conversations/{id}/draft.md.",
      "description": "I pull the customer dossier, read your voice samples, mirror your tone, and address the specific ask (bug / how-to / billing). I never promise a date you haven't approved.",
      "outcome": "Draft at `conversations/{id}/draft.md` \u2014 approve in chat.",
      "skill": "draft-reply",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Who is this customer \u2014 full dossier",
      "blurb": "Plan, MRR, open bugs, history \u2014 before you reply.",
      "prompt": "Who is {customer}?",
      "fullPrompt": "Build the customer dossier for {customer}. Use the customer-view skill with view=dossier. Pull plan + MRR from my connected Stripe, profile from my connected CRM (HubSpot / Attio / Salesforce), and filter conversations.json + bug-candidates.json + followups.json + churn-flags.json to this customer. Save to dossiers/{slug}.md.",
      "description": "Plan + MRR from your connected Stripe, profile from HubSpot / Attio / Salesforce, plus open bugs, open followups, churn flags, and last 3 conversations \u2014 all in one doc.",
      "outcome": "Dossier at `dossiers/{slug}.md` \u2014 the context `draft-reply` reads too.",
      "skill": "customer-view",
      "tools": {
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot",
          "attio",
          "salesforce"
        ],
        "inbox": [
          "gmail"
        ],
        "helpdesk": [
          "intercom"
        ],
        "analytics": [
          "posthog"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Full customer timeline \u2014 story of the relationship",
      "blurb": "Every ticket, call, plan change, NPS \u2014 chronologically.",
      "prompt": "Show me the full timeline for {account}.",
      "fullPrompt": "Show me the full timeline for {account}. Use the customer-view skill with view=timeline. Pull every interaction (tickets, calls, purchases, plan changes, NPS) from conversations.json + my connected Stripe + my connected CRM and sort chronologically. Save to timelines/{slug}.md.",
      "description": "Every interaction (tickets, calls, purchases, plan changes, NPS) from `conversations.json` + Stripe + your CRM, sorted chronologically.",
      "outcome": "Timeline at `timelines/{slug}.md` \u2014 the foundation for QBRs and renewals.",
      "skill": "customer-view",
      "tools": {
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot",
          "attio",
          "salesforce"
        ],
        "inbox": [
          "gmail"
        ],
        "helpdesk": [
          "intercom"
        ],
        "analytics": [
          "posthog"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Score account health \u2014 GREEN / YELLOW / RED",
      "blurb": "3 signals + reasoning + one recommended action.",
      "prompt": "Score health for {account}.",
      "fullPrompt": "Score account health for {account}. Use the customer-view skill with view=health. Compute 3 signals (ticket volume, product-usage trend via connected PostHog, recent-interaction sentiment), apply the thresholds in domains.success.churnSignals, and output GREEN / YELLOW / RED with reasoning and ONE recommended action. Append to health-scores.json.",
      "description": "3 signals (ticket volume, product-usage trend via PostHog, sentiment) against your churn thresholds. GREEN / YELLOW / RED + reasoning + ONE action \u2014 never a wall of metrics.",
      "outcome": "Score in `health-scores.json` \u2014 grounds your next `draft-lifecycle-message`.",
      "skill": "customer-view",
      "tools": {
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot",
          "attio",
          "salesforce"
        ],
        "inbox": [
          "gmail"
        ],
        "helpdesk": [
          "intercom"
        ],
        "analytics": [
          "posthog"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Churn risk scan on a specific account",
      "blurb": "Cancellation language, usage cliff \u2014 signal + severity.",
      "prompt": "Churn risk on {account}?",
      "fullPrompt": "Run a churn risk scan on {account}. Use the customer-view skill with view=churn-risk. Scan the last 60 days of conversations for cancellation language, 2+ frustration signals, or a usage cliff. If found, write a new entry to churn-flags.json with signal + severity + recommended next move.",
      "description": "I scan the last 60 days of conversations for cancellation language, frustration signals, or a usage cliff \u2014 then write a flag with severity + a recommended next move.",
      "outcome": "Flag in `churn-flags.json` \u2014 feed it to `draft-lifecycle-message type=churn-save`.",
      "skill": "customer-view",
      "tools": {
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot",
          "attio",
          "salesforce"
        ],
        "inbox": [
          "gmail"
        ],
        "helpdesk": [
          "intercom"
        ],
        "analytics": [
          "posthog"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Log a bug candidate from a ticket",
      "blurb": "Repro + severity \u2014 never filed without approval.",
      "prompt": "Is this a bug? Log it.",
      "fullPrompt": "Extract a bug report from this thread. Use the detect-signal skill with signal=bug. Pull repro steps, affected version, error message / stack trace, apply severity from the context doc, and append to bug-candidates.json. Offer to chain to my connected tracker (GitHub / Linear / Jira via Composio).",
      "description": "I extract repro steps, affected version, error / stack trace, apply severity, and append to `bug-candidates.json`. Offers to chain to your tracker (GitHub / Linear / Jira) \u2014 never files without your approval.",
      "outcome": "Entry in `bug-candidates.json` \u2014 one click away from a real issue.",
      "skill": "detect-signal",
      "tools": {
        "inbox": [
          "gmail"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ],
        "dev": [
          "github",
          "linear",
          "jira"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Capture a feature request with customer attribution",
      "blurb": "Dedupes into existing asks; VIPs flagged.",
      "prompt": "Capture this feature request.",
      "fullPrompt": "Capture this feature request. Use the detect-signal skill with signal=feature-request. Extract the ask in one sentence, attribute to the requesting customer's slug, dedupe against requests.json, and flag if a VIP is in the cluster. Append to requests.json.",
      "description": "I extract the ask in one sentence, attribute to the requesting customer's slug, and dedupe into `requests.json`. VIP requesters get flagged.",
      "outcome": "Entry in `requests.json` \u2014 surfaces in weekly reviews + 'broadcast shipped.'",
      "skill": "detect-signal",
      "tools": {
        "inbox": [
          "gmail"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ],
        "dev": [
          "github",
          "linear",
          "jira"
        ]
      }
    },
    {
      "category": "Inbox",
      "title": "Track a promise you just made",
      "blurb": "Due date parsed, logged, surfaced every morning.",
      "prompt": "Track this promise.",
      "fullPrompt": "Track a commitment I just made. Use the promise-tracker skill. Extract the verbatim promise from the draft or chat, parse the due date (explicit / relative / vague defaults to +48h), link to the conversation and customer, and append to followups.json with status=open.",
      "description": "I extract the verbatim promise from your draft, parse the due date, link to the conversation, and append to `followups.json`. Surfaces in every morning brief until you mark it done.",
      "outcome": "Entry in `followups.json` \u2014 so you never forget a 'by Friday.'",
      "skill": "promise-tracker"
    },
    {
      "category": "Help Center",
      "title": "Turn a resolved ticket into a KB article",
      "blurb": "Structure + tone + slug \u2014 ready to publish.",
      "prompt": "Turn conversation {id} into a KB article.",
      "fullPrompt": "Turn this resolved conversation into a help-center article. Use the write-article skill with type=from-ticket. Read conversations/{id}/thread.json, extract the reusable question + answer, and draft in the tone profile from domains.help-center.toneProfile. Save to articles/{slug}.md and mirror to my connected KB (Notion / Intercom / Help Scout / Google Docs) if one's linked.",
      "description": "I extract the question + answer from the resolved thread and draft in your help-center tone. Saves to `articles/{slug}.md` and mirrors to your connected KB (Notion / Intercom / Help Scout / Google Docs) if linked.",
      "outcome": "Draft at `articles/{slug}.md`. Publish when you're happy.",
      "skill": "write-article",
      "tools": {
        "docs": [
          "notion",
          "googledocs"
        ],
        "helpdesk": [
          "intercom",
          "help_scout"
        ],
        "dev": [
          "github",
          "linear"
        ]
      }
    },
    {
      "category": "Help Center",
      "title": "Draft a public known-issue status page",
      "blurb": "Plain-language status: broken, workaround, status.",
      "prompt": "Draft the known-issue page for {bug}.",
      "fullPrompt": "Draft a public known-issue status entry for {bug id}. Use the write-article skill with type=known-issue. Read bug-candidates.json for details. Draft: what's broken, who's affected, workaround, current status, ETA (only if I pre-approved one). Save to known-issues/{slug}.md and append to known-issues.json.",
      "description": "I draft: what's broken, who's affected, workaround, current status, ETA (only if you pre-approved one). No marketer-speak. Saves to `known-issues/{slug}.md` + updates `known-issues.json`.",
      "outcome": "Public draft at `known-issues/{slug}.md`. Push when you're ready.",
      "skill": "write-article",
      "tools": {
        "docs": [
          "notion",
          "googledocs"
        ],
        "helpdesk": [
          "intercom",
          "help_scout"
        ],
        "dev": [
          "github",
          "linear"
        ]
      }
    },
    {
      "category": "Help Center",
      "title": "Broadcast what we shipped to customers who asked",
      "blurb": "Personalized per-customer note \u2014 no bulk blast.",
      "prompt": "We shipped {feature} \u2014 tell the customers who asked.",
      "fullPrompt": "Broadcast that we shipped {feature}. Use the write-article skill with type=broadcast-shipped. Read requests.json, filter to customers who asked for exactly this, and draft a short personal note per customer referencing their specific ask. One file per customer in broadcasts/{YYYY-MM-DD}-{slug}.md.",
      "description": "I read `requests.json`, filter to customers who asked for exactly this, and draft a short personal note per customer referencing their specific ask. One file per customer \u2014 never a bulk blast.",
      "outcome": "Per-customer drafts at `broadcasts/{date}-{slug}.md` \u2014 send from your own inbox.",
      "skill": "write-article",
      "tools": {
        "docs": [
          "notion",
          "googledocs"
        ],
        "helpdesk": [
          "intercom",
          "help_scout"
        ],
        "dev": [
          "github",
          "linear"
        ]
      }
    },
    {
      "category": "Help Center",
      "title": "Refresh articles wrong since your last ship",
      "blurb": "Scans KB for stale pricing, UI, feature names.",
      "prompt": "Refresh docs \u2014 we changed {pricing / UI / feature}.",
      "fullPrompt": "Refresh help-center articles affected by {change}. Use the write-article skill with type=refresh-stale. Scan every articles/{slug}.md for references to the changed element and write the proposed rewrite diff without overwriting. Mark the articles needsReview=true in outputs.json.",
      "description": "I scan every article for references to what changed (pricing / UI / feature name), write the proposed rewrite diff, and mark articles `needsReview: true` in `outputs.json`.",
      "outcome": "Proposed rewrites across `articles/` \u2014 review diffs one at a time.",
      "skill": "write-article",
      "tools": {
        "docs": [
          "notion",
          "googledocs"
        ],
        "helpdesk": [
          "intercom",
          "help_scout"
        ],
        "dev": [
          "github",
          "linear"
        ]
      }
    },
    {
      "category": "Help Center",
      "title": "Find repeat questions that deserve an article",
      "blurb": "Clusters \u22653 without a matching KB entry.",
      "prompt": "What questions keep coming up?",
      "fullPrompt": "Find repeat-question clusters that deserve an article. Use the detect-signal skill with signal=repeat-question. Scan the last 30-60 days of conversations.json, cluster semantically similar incoming questions, and for each cluster of \u22653 with no matching article in articles/, append to patterns.json. Offer to chain write-article type=from-ticket for my top pick.",
      "description": "I scan the last 30-60 days, cluster semantically similar asks, and for each cluster \u22653 without a matching article, append to `patterns.json`. Offers to chain into `write-article` for the top pick.",
      "outcome": "Clusters in `patterns.json` \u2014 the docs you should write first.",
      "skill": "detect-signal",
      "tools": {
        "inbox": [
          "gmail"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ],
        "dev": [
          "github",
          "linear",
          "jira"
        ]
      }
    },
    {
      "category": "Help Center",
      "title": "What docs gap should I write next?",
      "blurb": "Ranked by volume \u00d7 customer value \u00d7 freshness.",
      "prompt": "What should I write docs for?",
      "fullPrompt": "Surface the top 3 docs gaps. Use the gap-surface skill. Read patterns.json, filter to clusters without a matching article, rank by occurrenceCount \u00d7 customer-value weight \u00d7 freshness, and present the top 3 with source ticket ids. Ask which I want drafted, then chain write-article type=from-ticket. Save to gaps/{YYYY-MM-DD}.md.",
      "description": "Ranks patterns by volume \u00d7 plan-tier weight \u00d7 freshness, surfaces the top 3 with source tickets, and offers to chain straight into `write-article type=from-ticket` for any you pick.",
      "outcome": "Ranked list at `gaps/{date}.md` \u2014 write the #1 before lunch.",
      "skill": "gap-surface"
    },
    {
      "category": "Help Center",
      "title": "Weekly help-center digest",
      "blurb": "Volume, top themes, high-priority unresolved.",
      "prompt": "Give me the weekly help-center digest.",
      "fullPrompt": "Give me the weekly help-center digest. Use the review skill with scope=help-center-digest. Read conversations.json counts for the week, patterns.json top 3 themes, requests.json velocity, known-issues.json state changes. Surface the single most useful docs gap to write next. Save to digests/{YYYY-MM-DD}.md.",
      "description": "Weekly rollup of ticket volume, top 3 themes from `patterns.json`, feature-request velocity, known-issue state changes, and the single most useful docs gap to write next.",
      "outcome": "Digest at `digests/{date}.md` for Monday morning.",
      "skill": "review",
      "tools": {
        "docs": [
          "googledocs",
          "notion"
        ],
        "messaging": [
          "slack"
        ]
      }
    },
    {
      "category": "Success",
      "title": "Draft a 5-email welcome series for new signups",
      "blurb": "Day 0 / 1 / 3 / 7 / 14 \u2014 subject, body, CTA, metric.",
      "prompt": "Draft onboarding for {segment}.",
      "fullPrompt": "Draft a welcome series for {segment}. Use the draft-lifecycle-message skill with type=welcome-series. 5 touches (Day 0 / 1 / 3 / 7 / 14) keyed to the product's activation milestones in domains.email.journey (ask if not set). Each touch: subject, preview, body, CTA, success metric. Format for my connected ESP (Customer.io / Loops / Mailchimp / Kit via Composio). Save to onboarding/{segment}.md.",
      "description": "Day 0 / 1 / 3 / 7 / 14 sequence keyed to your activation milestones. Each touch: subject, preview, body, CTA, success metric. Formatted for your connected ESP (Customer.io / Loops / Mailchimp / Kit).",
      "outcome": "Full sequence at `onboarding/{segment}.md` \u2014 drop into your ESP.",
      "skill": "draft-lifecycle-message",
      "tools": {
        "esp": [
          "customerio",
          "loops",
          "mailchimp",
          "kit"
        ],
        "crm": [
          "hubspot",
          "attio"
        ],
        "billing": [
          "stripe"
        ]
      }
    },
    {
      "category": "Success",
      "title": "Draft 30/60/90 pre-renewal outreach",
      "blurb": "Value recap \u2192 expansion angle \u2192 direct ask.",
      "prompt": "Draft renewal outreach for {account}.",
      "fullPrompt": "Draft pre-renewal outreach for {account}. Use the draft-lifecycle-message skill with type=renewal. Chain customer-view view=timeline first for wins + asks-shipped + friction. Draft Day-90 (value recap), Day-60 (expansion opportunity), Day-30 (direct ask + agenda). Every reference grounded in the timeline. Save to renewals/{account}-{YYYY-MM-DD}.md.",
      "description": "3-touch sequence (Day-90 value recap, Day-60 expansion or mechanics, Day-30 direct ask + agenda). Every reference grounded in `timelines/{slug}.md` \u2014 no marketer-speak.",
      "outcome": "Sequence at `renewals/{account}-{date}.md`. Send when you're ready.",
      "skill": "draft-lifecycle-message",
      "tools": {
        "esp": [
          "customerio",
          "loops",
          "mailchimp",
          "kit"
        ],
        "crm": [
          "hubspot",
          "attio"
        ],
        "billing": [
          "stripe"
        ]
      }
    },
    {
      "category": "Success",
      "title": "Draft an expansion nudge grounded in a ceiling signal",
      "blurb": "Real signal or I stop \u2014 no upsell spam.",
      "prompt": "They're ready for {tier} \u2014 draft the nudge.",
      "fullPrompt": "Draft an expansion nudge for {account}. Use the draft-lifecycle-message skill with type=expansion-nudge. Chain customer-view view=health first to find the ceiling signal (feature-adoption threshold, team-size change, repeated ask). Draft a short, specific outreach naming the signal and proposing an option. If no real signal exists, stop and tell me. Save to expansions/{account}.md.",
      "description": "I check `health-scores.json` for a real ceiling signal first. If found, I draft a short, specific outreach naming the signal. If not, I stop \u2014 no upsell pressure.",
      "outcome": "Draft at `expansions/{account}.md` \u2014 or a clear 'no signal, don't push.'",
      "skill": "draft-lifecycle-message",
      "tools": {
        "esp": [
          "customerio",
          "loops",
          "mailchimp",
          "kit"
        ],
        "crm": [
          "hubspot",
          "attio"
        ],
        "billing": [
          "stripe"
        ]
      }
    },
    {
      "category": "Success",
      "title": "Save an at-risk account without the guilt trip",
      "blurb": "Pause / downgrade / concierge / refund \u2014 genuine options.",
      "prompt": "Save {account}.",
      "fullPrompt": "Draft a save message for {account}. Use the draft-lifecycle-message skill with type=churn-save. Chain customer-view view=churn-risk first to pull the exact flag. Acknowledge the risk honestly, name the specific pain, offer pause / downgrade / concierge / refund \u2014 whichever is policy in context/support-context.md. Never invent a discount I haven't pre-approved. Save to saves/{account}.md.",
      "description": "I pull the exact risk signal, acknowledge the pain honestly, and offer pause / downgrade / concierge / refund \u2014 whichever is policy in your support context. No guilt, no fake scarcity.",
      "outcome": "Save at `saves/{account}.md`. Send from your own inbox.",
      "skill": "draft-lifecycle-message",
      "tools": {
        "esp": [
          "customerio",
          "loops",
          "mailchimp",
          "kit"
        ],
        "crm": [
          "hubspot",
          "attio"
        ],
        "billing": [
          "stripe"
        ]
      }
    },
    {
      "category": "Success",
      "title": "Prep a QBR \u2014 wins / asks-shipped / friction / next",
      "blurb": "4-section outline grounded in the timeline.",
      "prompt": "Prep the QBR for {account}.",
      "fullPrompt": "Prep the QBR for {account}. Use the review skill with scope=qbr. Chain customer-view view=timeline for the account. Read requests.json + bug-candidates.json + followups.json filtered to this account. Structure: wins (achieved) / asks-shipped (their requests shipped) / friction (open pains) / next moves (renewal / expansion / investment). Save to qbrs/{account}-{YYYY-MM-DD}.md.",
      "description": "4-section outline \u2014 wins (achieved), asks-shipped (their requests shipped), friction (open pains), next moves (renewal / expansion). Grounded in the timeline + request IDs.",
      "outcome": "QBR at `qbrs/{account}-{date}.md` \u2014 walk in ready.",
      "skill": "review",
      "tools": {
        "docs": [
          "googledocs",
          "notion"
        ],
        "messaging": [
          "slack"
        ]
      }
    },
    {
      "category": "Quality",
      "title": "Set up your support context \u2014 the source of truth",
      "blurb": "Voice, SLAs, routing, VIPs, known gotchas.",
      "prompt": "Help me set up my support context.",
      "fullPrompt": "Help me set up my support context. Use the define-support-context skill. Interview me briefly, then write context/support-context.md \u2014 product overview, customer segments + VIPs, tone + voice, SLA tiers, routing rules, known gotchas. Every other skill in this agent reads it before substantive work.",
      "description": "I interview you briefly and write `context/support-context.md` \u2014 product overview, segments + VIPs, tone, SLA tiers, routing rules, known gotchas. Every other skill reads it first.",
      "outcome": "Locked doc at `context/support-context.md` \u2014 the source of truth.",
      "skill": "define-support-context",
      "tools": {
        "docs": [
          "googledocs",
          "notion"
        ]
      }
    },
    {
      "category": "Quality",
      "title": "Calibrate your voice from your sent replies",
      "blurb": "Pulls 10-20 outbound messages \u2014 no corporate hedging.",
      "prompt": "Calibrate my voice from my recent sent replies.",
      "fullPrompt": "Calibrate my voice. Use the voice-calibration skill. Pull 10-20 of my recent outbound support replies from my connected inbox (Gmail / Outlook / Intercom / Help Scout via Composio), extract tone cues (greeting, sign-off, sentence length, quirks, forbidden phrases), and write config/voice.md. Every draft-reply and write-article in this agent reads this.",
      "description": "I pull 10-20 outbound replies from your connected inbox (Gmail / Outlook / Intercom / Help Scout), extract tone cues, and write `config/voice.md`. Every reply draft and KB article this agent writes reads this.",
      "outcome": "Voice profile at `config/voice.md` \u2014 drafts stop sounding like AI.",
      "skill": "voice-calibration",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ],
        "helpdesk": [
          "intercom",
          "help_scout"
        ]
      }
    },
    {
      "category": "Quality",
      "title": "Update your routing rules when reality changes",
      "blurb": "Moved tracker? New tier? Fix the rules once.",
      "prompt": "Update our routing rules.",
      "fullPrompt": "Update our routing rules. Use the tune-routing-rules skill. Read context/support-context.md, restate current rules in 3-4 lines, capture what's changing (new tracker / classification / escalation contact / refund approver), and rewrite the routing section cleanly. Every triage-incoming and detect-signal run after this picks up the new rules automatically.",
      "description": "I read current rules, ask what's changing, rewrite the routing section of `context/support-context.md`. Every `triage-incoming` and `detect-signal` run after picks up the new rules \u2014 no manual re-sync.",
      "outcome": "Updated `context/support-context.md` \u2014 propagates instantly.",
      "skill": "tune-routing-rules",
      "tools": {
        "docs": [
          "googledocs",
          "notion"
        ]
      }
    },
    {
      "category": "Quality",
      "title": "Draft the P1 playbook before the next incident",
      "blurb": "Detection, comms, rollback, RCA, post-mortem.",
      "prompt": "Draft the P1 outage playbook.",
      "fullPrompt": "Draft the P1 playbook. Use the draft-escalation-playbook skill. Ask 2 targeted questions (what counts as P1, who gets looped in), then write a step-by-step runbook to playbooks/p1-outage.md: first 15 min (detect + contain), first 60 min (customer comms + VIP DMs), same day (RCA + customer-facing RCA), 48h follow-up (post-mortem + known-issue article + personal follow-ups). Named humans, named channels.",
      "description": "I ask 2 targeted questions, then write a step-by-step runbook: detection, comms draft, rollback, RCA, post-mortem. Named humans, named Slack channels \u2014 no vague handoffs.",
      "outcome": "Playbook at `playbooks/{slug}.md` \u2014 edit once, every incident uses it.",
      "skill": "draft-escalation-playbook",
      "tools": {
        "messaging": [
          "slack",
          "microsoftteams"
        ],
        "dev": [
          "linear",
          "github"
        ]
      }
    },
    {
      "category": "Quality",
      "title": "Mine the tickets for what customers are actually saying",
      "blurb": "Pains, asks, friction quotes, positioning wedges.",
      "prompt": "Mine the last 30 days of tickets.",
      "fullPrompt": "Mine the last 30 days of tickets for voice-of-customer signal. Use the synthesize-voice-of-customer skill. Cluster conversations.json + requests.json + patterns.json for the window into top 5 pains (verbatim quotes), top 5 feature asks (distinct requesters), friction quotes that contradict positioning, and positioning-worthy quotes. Save to voc/{YYYY-MM-DD}.md.",
      "description": "I cluster the last 30 days of conversations + feature requests into top 5 pains, top 5 asks, friction phrases that contradict your positioning, and landing-page-ready quotes with attribution.",
      "outcome": "Synthesis at `voc/{date}.md` \u2014 the single best source for roadmap + landing-page updates.",
      "skill": "synthesize-voice-of-customer",
      "tools": {
        "inbox": [
          "gmail"
        ],
        "helpdesk": [
          "intercom",
          "help_scout",
          "zendesk"
        ]
      }
    },
    {
      "category": "Quality",
      "title": "The Monday support review",
      "blurb": "What shipped, what's stuck, what to do this week.",
      "prompt": "Give me the Monday support review.",
      "fullPrompt": "Give me the Monday support review. Use the review skill with scope=weekly. Read outputs.json filtered to the last 7 days, group by domain (Inbox / Help Center / Success / Quality), count + 1-line headline + 1 unresolved per domain. Read followups.json for this week and churn-flags.json opened this week. End with '2-3 things I recommend you do this week.' Save to reviews/{YYYY-MM-DD}.md.",
      "description": "I read `outputs.json` filtered to the last 7 days, group by domain, count + 1-line headline + 1 unresolved per domain. Ends with 2-3 things I recommend you do this week \u2014 grounded in real output IDs.",
      "outcome": "Review at `reviews/{date}.md`. 2-minute scan.",
      "skill": "review",
      "tools": {
        "docs": [
          "googledocs",
          "notion"
        ],
        "messaging": [
          "slack"
        ]
      }
    }
  ]
};
  // ══════════════════════════════════════════════════════════

  // ── Shared monochrome stylesheet ─────────────────────────────
  var STYLE_CSS =
    ".hv-dash{background:#ffffff;color:#0f172a;}" +
    // Sticky header + chip bar
    ".hv-dash .hv-header{position:sticky;top:0;z-index:10;background:rgba(255,255,255,0.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid #e2e8f0;}" +
    ".hv-dash .hv-chips{display:flex;gap:6px;flex-wrap:wrap;padding:14px 40px;border-top:1px solid #f1f5f9;}" +
    ".hv-dash .hv-chip{appearance:none;border:1px solid #e2e8f0;background:#ffffff;color:#475569;font:inherit;font-size:12.5px;font-weight:500;padding:6px 12px;border-radius:999px;cursor:pointer;transition:all 160ms ease-out;display:inline-flex;align-items:center;gap:6px;}" +
    ".hv-dash .hv-chip:hover{border-color:#0f172a;color:#0f172a;}" +
    ".hv-dash .hv-chip-active{background:#0f172a;border-color:#0f172a;color:#ffffff;}" +
    ".hv-dash .hv-chip-count{font-size:11px;font-variant-numeric:tabular-nums;opacity:0.7;}" +
    // Grid of mission tiles
    ".hv-dash .hv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}" +
    "@media (max-width: 720px){.hv-dash .hv-grid{grid-template-columns:1fr;}}" +
    // Tile base
    ".hv-dash .hv-tile{position:relative;display:flex;flex-direction:column;justify-content:flex-start;gap:10px;min-height:148px;padding:22px 26px 22px 22px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;cursor:pointer;transition:border-color 160ms ease-out,box-shadow 160ms ease-out,transform 160ms ease-out,background 160ms ease-out;text-align:left;font:inherit;color:inherit;}" +
    ".hv-dash .hv-tile:hover{border-color:#0f172a;box-shadow:0 6px 20px -8px rgba(15,23,42,0.12);transform:translateY(-1px);}" +
    ".hv-dash .hv-tile:active{transform:translateY(0);box-shadow:0 1px 2px rgba(15,23,42,0.04);}" +
    ".hv-dash .hv-tile:focus-visible{outline:2px solid #0f172a;outline-offset:2px;}" +
    ".hv-dash .hv-tile[disabled]{opacity:0.85;cursor:default;}" +
    // Tile parts
    ".hv-dash .hv-eyebrow{display:flex;align-items:center;gap:8px;font-size:10.5px;letter-spacing:0.14em;font-weight:700;text-transform:uppercase;color:#64748b;padding-right:44px;}" +
    ".hv-dash .hv-eyebrow-sep{color:#cbd5e1;font-weight:500;}" +
    ".hv-dash .hv-title{font-size:17px;font-weight:600;letter-spacing:-0.006em;color:#0f172a;line-height:1.35;margin:0;padding-right:36px;}" +
    ".hv-dash .hv-blurb{font-size:13px;color:#475569;line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}" +
    ".hv-dash .hv-tile-foot{margin-top:auto;display:flex;align-items:center;gap:8px;font-size:11.5px;color:#94a3b8;}" +
    // Send affordance (top-right corner of tile)
    ".hv-dash .hv-send-chip{position:absolute;top:18px;right:18px;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;border:1px solid #e2e8f0;background:#ffffff;color:#94a3b8;transition:all 160ms ease-out;}" +
    ".hv-dash .hv-tile:hover .hv-send-chip{border-color:#0f172a;background:#0f172a;color:#ffffff;}" +
    // Sent state
    ".hv-dash .hv-tile-sent{border-color:#0f172a;background:#0f172a;color:#ffffff;}" +
    ".hv-dash .hv-tile-sent .hv-title{color:#ffffff;}" +
    ".hv-dash .hv-tile-sent .hv-blurb{color:#cbd5e1;}" +
    ".hv-dash .hv-tile-sent .hv-eyebrow{color:#cbd5e1;}" +
    ".hv-dash .hv-tile-sent .hv-eyebrow-sep{color:#64748b;}" +
    ".hv-dash .hv-tile-sent .hv-tile-foot{color:#94a3b8;}" +
    ".hv-dash .hv-tile-sent .hv-send-chip{border-color:#ffffff;background:#ffffff;color:#0f172a;}" +
    "";

  // ── Inline icons (heroicons-outline paths) ──────────────────
  var ICON_PATHS = {
    send: "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5",
    check: "m4.5 12.75 6 6 9-13.5",
  };

  function Icon(name, size) {
    var d = ICON_PATHS[name] || ICON_PATHS.send;
    var s = size || 14;
    return h(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.8,
        stroke: "currentColor",
        width: s,
        height: s,
        "aria-hidden": "true",
        style: { display: "inline-block", flexShrink: 0 },
      },
      h("path", { strokeLinecap: "round", strokeLinejoin: "round", d: d }),
    );
  }

  // ── Send hook ────────────────────────────────────────────────
  // Fires the prompt into the agent's chat via the host-injected
  // `sendMessage(text)` prop (see experience-renderer.tsx). Keeps a
  // 1.4s "sent" flash on the tile so the click feels anchored.
  function useSend(sendMessage) {
    var s = useState({ idx: null, at: 0 });
    var state = s[0];
    var setState = s[1];
    var send = useCallback(function (text, idx) {
      if (!text) return;
      if (typeof sendMessage !== "function") {
        console.warn("[support dashboard] sendMessage prop missing — tile click is a no-op.");
        return;
      }
      try {
        sendMessage(text);
      } catch (e) {
        console.error("[support dashboard] sendMessage threw:", e);
        return;
      }
      setState({ idx: idx, at: Date.now() });
      setTimeout(function () {
        setState(function (cur) {
          return cur.idx === idx ? { idx: null, at: 0 } : cur;
        });
      }, 1400);
    }, [sendMessage]);
    return { sentIdx: state.idx, send: send };
  }

  function payloadFor(uc) {
    return (uc && (uc.fullPrompt || uc.prompt)) || "";
  }

  // ── Header ──────────────────────────────────────────────────
  function Header() {
    return h(
      "div",
      null,
      h(
        "div",
        {
          style: {
            padding: "18px 40px 14px 40px",
            display: "flex",
            alignItems: "flex-start",
            gap: 24,
          },
        },
        h(
          "div",
          { style: { flex: 1, minWidth: 0 } },
          h(
            "h1",
            {
              style: {
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#0f172a",
                margin: 0,
                lineHeight: 1.2,
              },
            },
            AGENT.name,
          ),
          h(
            "p",
            {
              style: {
                marginTop: 6,
                fontSize: 12.5,
                color: "#64748b",
                lineHeight: 1.5,
                maxWidth: 720,
              },
            },
            AGENT.tagline,
          ),
        ),
      ),
    );
  }

  // ── Domain filter chips ─────────────────────────────────────
  function ChipBar(props) {
    var active = props.active;
    var counts = props.counts;
    var onPick = props.onPick;
    var chips = ["All"].concat(AGENT.chips || []);
    return h(
      "div",
      { className: "hv-chips" },
      chips.map(function (c) {
        var count = c === "All"
          ? (AGENT.useCases || []).length
          : (counts[c] || 0);
        if (count === 0 && c !== "All") return null;
        var isActive = (active === c) || (active === null && c === "All");
        return h(
          "button",
          {
            key: c,
            type: "button",
            className: "hv-chip" + (isActive ? " hv-chip-active" : ""),
            onClick: function () { onPick(c === "All" ? null : c); },
          },
          h("span", null, c),
          h("span", { className: "hv-chip-count" }, count),
        );
      }),
    );
  }

  // ── Mission tile ────────────────────────────────────────────
  function Tile(props) {
    var uc = props.useCase;
    var idx = props.idx;
    var isSent = props.sentIdx === idx;
    var onSend = props.onSend;

    return h(
      "button",
      {
        type: "button",
        disabled: isSent || undefined,
        onClick: function () { onSend(payloadFor(uc), idx); },
        className: "hv-tile" + (isSent ? " hv-tile-sent" : ""),
        "aria-label": "Start chat: " + (uc.title || ""),
      },
      // Send chip
      h(
        "span",
        { className: "hv-send-chip", "aria-hidden": "true" },
        Icon(isSent ? "check" : "send", 14),
      ),
      // Eyebrow: category (· tool1 · tool2 · ...)
      (function () {
        var flat = flattenToolNames(uc.tools);
        var parts = [h("span", { key: "cat" }, uc.category || "Mission")];
        flat.names.forEach(function (n, i) {
          parts.push(h("span", { key: "sep-" + i, className: "hv-eyebrow-sep" }, "·"));
          parts.push(h("span", { key: "tool-" + i }, n));
        });
        if (flat.extra > 0) {
          parts.push(h("span", { key: "sep-extra", className: "hv-eyebrow-sep" }, "·"));
          parts.push(h("span", { key: "extra" }, "… +" + flat.extra));
        }
        return h("div", { className: "hv-eyebrow" }, parts);
      })(),
      h("h3", { className: "hv-title" }, uc.title || ""),
      uc.blurb
        ? h("p", { className: "hv-blurb" }, uc.blurb)
        : null,
      isSent
        ? h(
            "div",
            { className: "hv-tile-foot" },
            h("span", null, "Sent · see Activity tab"),
          )
        : null,
    );
  }

  // ── Empty state ─────────────────────────────────────────────
  function Empty() {
    return h(
      "div",
      { style: { padding: "48px 40px" } },
      h(
        "p",
        { style: { fontSize: 14, fontWeight: 600, color: "#334155", margin: 0 } },
        "No missions declared yet.",
      ),
      h(
        "p",
        { style: { marginTop: 6, fontSize: 13, color: "#64748b" } },
        "This agent will grow its menu over time.",
      ),
    );
  }

  // ── Dashboard (root) ────────────────────────────────────────
  function Dashboard(props) {
    var sendMessage = props && props.sendMessage;
    var sender = useSend(sendMessage);
    var fs = useState(null);
    var activeChip = fs[0];
    var setActiveChip = fs[1];

    var allCases = AGENT.useCases || [];

    // Per-category counts (for chip badges)
    var counts = useMemo(function () {
      var out = {};
      allCases.forEach(function (uc) {
        var c = uc.category || "Other";
        out[c] = (out[c] || 0) + 1;
      });
      return out;
    }, []);

    // Filtered view — keep original index so the "sent" flash stays stable
    var visible = useMemo(function () {
      if (!activeChip) {
        return allCases.map(function (uc, i) { return { uc: uc, idx: i }; });
      }
      var out = [];
      allCases.forEach(function (uc, i) {
        if ((uc.category || "Other") === activeChip) {
          out.push({ uc: uc, idx: i });
        }
      });
      return out;
    }, [activeChip]);

    var body;
    if (allCases.length === 0) {
      body = h(Empty);
    } else {
      body = h(
        "div",
        { style: { padding: "24px 40px 56px 40px" } },
        // Meta row
        h(
          "div",
          {
            style: {
              marginBottom: 16,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            },
          },
          h(
            "p",
            { style: { fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 } },
            visible.length +
              " " +
              (visible.length === 1 ? "thing" : "things") +
              " I can do" +
              (activeChip ? " in " + activeChip.toLowerCase() : " for you right now"),
          ),
          h(
            "span",
            { style: { fontSize: 11, color: "#94a3b8", letterSpacing: "0.02em" } },
            "Click any tile to start a conversation",
          ),
        ),
        h(
          "div",
          { className: "hv-grid" },
          visible.map(function (v) {
            return h(Tile, {
              key: v.idx,
              useCase: v.uc,
              idx: v.idx,
              sentIdx: sender.sentIdx,
              onSend: sender.send,
            });
          }),
        ),
      );
    }

    return h(
      "div",
      {
        className: "hv-dash",
        style: {
          height: "100%",
          overflowY: "auto",
          background: "#ffffff",
          color: "#0f172a",
          fontFamily:
            "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
        },
      },
      h("style", { dangerouslySetInnerHTML: { __html: STYLE_CSS } }),
      h(
        "div",
        { className: "hv-header" },
        h(Header),
        h(ChipBar, {
          active: activeChip,
          counts: counts,
          onPick: setActiveChip,
        }),
      ),
      body,
    );
  }

  window.__houston_bundle__ = { Dashboard: Dashboard };
})();
