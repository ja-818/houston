// Houston agent dashboard bundle — Marketing.
// Hand-crafted IIFE. No ES modules, no build step, no import statements.
// Access React via window.Houston.React. Export via window.__houston_bundle__.
//
// This dashboard is the founder's quick-CTA menu for the unified marketing
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

  // ═════════ PER-AGENT CONFIG (injected by generator) ═════════
  // ═════════ Slug → display-name dictionary ═════════
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
  // Flatten a grouped tools map {cat:[slug,...]} to a capped list of display names.
  function flattenToolNames(tools, cap) {
    if (!tools || typeof tools !== "object") return { names: [], extra: 0 };
    var names = [];
    var seen = {};
    Object.keys(tools).forEach(function (cat) {
      (tools[cat] || []).forEach(function (slug) {
        if (seen[slug]) return;
        seen[slug] = true;
        names.push(displayName(slug));
      });
    });
    var extra = 0;
    if (cap && names.length > cap) {
      extra = names.length - cap;
      names = names.slice(0, cap);
    }
    return { names: names, extra: extra };
  }

  var AGENT = {
  "name": "Operations",
  "tagline": "Your full-stack operations operator. Planning, scheduling, finance hygiene, vendors, and data — one agent, one conversation.",
  "chips": [
    "Planning",
    "Scheduling",
    "Finance",
    "Vendors",
    "Data"
  ],
  "useCases": [
    {
      "category": "Planning",
      "title": "Draft the operating doc that anchors every other output",
      "blurb": "Company, priorities, rhythm, VIPs, vendor posture, hard nos.",
      "prompt": "Help me set up my operating context.",
      "fullPrompt": "Help me set up my operating context. Use the define-operating-context skill. Interview me briefly on company + priorities + rhythm + key contacts + tools + vendor posture + hard nos + voice, then write the full doc to context/operations-context.md — the source of truth every other skill reads before producing anything substantive.",
      "description": "I interview you briefly and write the full operating doc (company, priorities, rhythm, key contacts, tools, vendor posture, hard nos, voice) to context/operations-context.md. Every other skill reads it first.",
      "outcome": "A locked operating doc at context/operations-context.md. Every skill reads it before producing anything substantive.",
      "skill": "define-operating-context"
    },
    {
      "category": "Planning",
      "title": "The morning brief — what needs me today",
      "blurb": "Inbox + calendar + chat + drive, ranked. One move picked.",
      "prompt": "Give me today's morning brief.",
      "fullPrompt": "Give me today's morning brief. Use the brief skill with mode=daily. Roll up the last 24h from my connected inbox (Gmail / Outlook), calendar (Google Calendar), team chat (Slack), and drive (Google Drive). Produce: Fires (≤3), Today's meetings with prep notes, What changed overnight, Can-wait, and the one move for today. Save to briefs/{YYYY-MM-DD}.md.",
      "description": "I aggregate the last 24h of inbox, calendar, Slack, and drive activity into today's plan: Fires (≤3), today's meetings with prep notes, what changed overnight, and the one move to make.",
      "outcome": "Brief at briefs/{date}.md with the one move called out.",
      "skill": "brief",
      "tools": {
        "inbox": [
          "gmail"
        ],
        "calendar": [
          "googlecalendar"
        ],
        "messaging": [
          "slack"
        ],
        "files": [
          "googledrive"
        ],
        "meetings": [
          "fireflies",
          "gong"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "Turn a brain dump into today's plan",
      "blurb": "Parse, bucket, calendar-check, strategic picks.",
      "prompt": "Here's my brain dump — turn this into today's plan.",
      "fullPrompt": "Turn this brain dump into today's plan: {paste thoughts}. Use the brief skill with mode=daily — it'll auto-detect brain-dump sub-mode from the >100-word paste. Bucket into urgent-fires / strategic / operational / future-ideas / personal; calendar reality check; 2-3 strategic picks grounded in my active priorities; delegation candidates; parking lot. Save to briefs/{YYYY-MM-DD}-dump.md.",
      "description": "Paste your unstructured thoughts — I bucket them, cross-reference your calendar, pick 2-3 strategic items against your priorities, and flag delegation candidates.",
      "outcome": "Structured plan at briefs/{date}-dump.md.",
      "skill": "brief",
      "tools": {
        "inbox": [
          "gmail"
        ],
        "calendar": [
          "googlecalendar"
        ],
        "messaging": [
          "slack"
        ],
        "files": [
          "googledrive"
        ],
        "meetings": [
          "fireflies",
          "gong"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "The Monday operations review",
      "blurb": "What shipped, what's stale, what's next. One move.",
      "prompt": "Give me the Monday operations review.",
      "fullPrompt": "Give me the Monday operations review. Use the run-review skill with period=weekly. Aggregate everything I produced this past week from outputs.json across Planning / Scheduling / Finance / Vendors / Data. Flag what's stale (3+ weeks untouched), gaps against my active priorities, renewals in the next 30 days, and recommend the one most useful move for the week. Save to reviews/{YYYY-MM-DD}.md.",
      "description": "I aggregate everything this agent produced last week from outputs.json, flag gaps against your active priorities and upcoming renewals, and recommend the one move for the week.",
      "outcome": "Review at reviews/{date}.md with the one move called out.",
      "skill": "run-review",
      "tools": {
        "files": [
          "googlesheets"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "Prep the Q{N} board pack",
      "blurb": "TL;DR, business update, metrics, OKRs, wins, challenges, asks.",
      "prompt": "Prep the Q{N} board pack.",
      "fullPrompt": "Prep the Q{N} board pack. Use the prep-package skill with type=board-pack. Draft the standard 8 sections (TL;DR, business update, metrics, OKRs, wins, challenges, asks, appendix) from my outputs.json + okr-history.json + decisions.json + metrics-daily.json. Flag every TBD. Save to board-packs/{yyyy-qq}/board-pack.md with an optional Google Docs mirror if connected.",
      "description": "Draft the full 8-section board pack (TL;DR, business update, metrics, OKRs, wins, challenges, asks, appendix) from everything this agent has produced. Flags every TBD.",
      "outcome": "Pack at board-packs/{yyyy-qq}/board-pack.md (+ Google Doc mirror if connected).",
      "skill": "prep-package",
      "tools": {
        "docs": [
          "googledocs",
          "notion"
        ],
        "files": [
          "googledrive"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "Draft this month's investor update",
      "blurb": "CEO-voice narrative grounded in OKRs + decisions + metrics.",
      "prompt": "Draft the monthly investor update.",
      "fullPrompt": "Draft the monthly investor update. Use the prep-package skill with type=investor-update. CEO-voice narrative ~600-900 words: opening, highlights (3-5), lowlights (1-2), KR status block, asks (2-3), closing. Voice-matched from config/voice.md. Save to investor-updates/{yyyy-qq}/update.md.",
      "description": "CEO-voice narrative grounded in OKR movement, decisions, and metrics. Highlights, honest lowlights, asks, closing — all voice-matched to your samples.",
      "outcome": "Update at investor-updates/{yyyy-qq}/update.md.",
      "skill": "prep-package",
      "tools": {
        "docs": [
          "googledocs",
          "notion"
        ],
        "files": [
          "googledrive"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "Log a decision with the full context",
      "blurb": "ADR-style: alternatives, trade-offs, rationale, consequences.",
      "prompt": "Log the decision on {topic} — we're going with {X}.",
      "fullPrompt": "Log this decision. Use the log-decision skill. Write an ADR-style record with context, alternatives considered, trade-offs, the decision, rationale, consequences, and links to related initiatives. Save to decisions/{slug}/decision.md and append to decisions.json.",
      "description": "I write an ADR-style decision record with context, alternatives, trade-offs, rationale, and consequences — the thing you'll wish you had written 6 months from now.",
      "outcome": "Record at decisions/{slug}/decision.md and row in decisions.json.",
      "skill": "log-decision"
    },
    {
      "category": "Planning",
      "title": "Refresh the OKRs — what's on- and off-track",
      "blurb": "Per-KR value, direction, root cause if off-track.",
      "prompt": "Refresh the OKRs — which KRs are off-track?",
      "fullPrompt": "Refresh the OKRs. Use the track-okr skill. For each KR, pull the current value via any connected OKR tool (Notion / Airtable / Google Sheets), append a snapshot to okr-history.json, classify on-track / at-risk / off-track, and surface root causes from decisions.json and context/operations-context.md priorities for anything off-track. Save to okrs/{yyyy-qq}.md.",
      "description": "I refresh each KR via Notion / Airtable / Google Sheets, classify on-track / at-risk / off-track, and surface root causes from decisions + priorities for anything off-track.",
      "outcome": "Snapshot at okrs/{yyyy-qq}.md and row in okr-history.json.",
      "skill": "track-okr",
      "tools": {
        "docs": [
          "notion",
          "airtable"
        ],
        "files": [
          "googlesheets"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "Find the bottleneck — what's stuck?",
      "blurb": "Clustered evidence + hypothesis + proposed owner.",
      "prompt": "What's stuck — where are we losing time?",
      "fullPrompt": "Tell me what's stuck. Use the identify-bottleneck skill. Cluster evidence from recent weekly reviews, open decisions, open anomalies, off-track OKRs, and bounced follow-ups. Produce 1-3 named bottlenecks each with a hypothesis and a proposed owner to unblock. Append to bottlenecks.json.",
      "description": "I cluster evidence from your reviews, decisions, anomalies, and off-track KRs into named bottlenecks — each with a hypothesis and a proposed owner to unblock.",
      "outcome": "Entries in bottlenecks.json with hypotheses + proposed owners.",
      "skill": "identify-bottleneck"
    },
    {
      "category": "Scheduling",
      "title": "Triage my inbox — what needs me today?",
      "blurb": "Needs-me / can-wait / ignore with a verb+object per thread.",
      "prompt": "Triage my inbox.",
      "fullPrompt": "Triage my inbox. Use the triage skill with surface=inbox. Pull last-24h threads via Gmail / Outlook, classify each into needs-me-today / can-wait / ignore, rank the top bucket by time-sensitivity, and state a specific verb+object action per thread (not 'review'). Save to triage/{YYYY-MM-DD}.md.",
      "description": "I classify last-24h threads into needs-me-today / can-wait / ignore, rank the top bucket by time-sensitivity, and write a verb+object action per thread — not 'review.'",
      "outcome": "Triage at triage/{date}.md with counts + top action.",
      "skill": "triage",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ],
        "calendar": [
          "googlecalendar"
        ]
      }
    },
    {
      "category": "Scheduling",
      "title": "Scan my calendar for the week",
      "blurb": "Overbooks, missing buffers, VIP slots, unprepped meetings.",
      "prompt": "Scan my calendar and find conflicts for the week.",
      "fullPrompt": "Scan my calendar for the next 7 days. Use the triage skill with surface=calendar. Flag overbooks, back-to-back-with-no-buffer, focus-block clashes, unprotected VIP slots, and external meetings without prep. Rank by severity. Save to calendar-scans/{YYYY-MM-DD}.md and upsert calendar-conflicts.json.",
      "description": "I scan the next 7 days for overbooks, missing buffers, focus-block clashes, unprotected VIP time, and external meetings with no prep. Ranked by severity.",
      "outcome": "Scan at calendar-scans/{date}.md with the worst conflict called out.",
      "skill": "triage",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ],
        "calendar": [
          "googlecalendar"
        ]
      }
    },
    {
      "category": "Scheduling",
      "title": "Prep me for my 2pm meeting",
      "blurb": "Attendee intel, agenda, the thing not to forget.",
      "prompt": "Prep me for my 2pm with {name}.",
      "fullPrompt": "Prep me for my upcoming meeting with {name}. Use the brief skill with mode=meeting-pre. Pull recent email threads, public activity, and shared history for each external attendee. Draft a suggested agenda reflecting what they'll likely want, grounded in my priorities from context/operations-context.md. Call out the ONE thing not to forget. Save to meetings/{YYYY-MM-DD}-{slug}-pre.md.",
      "description": "Deep attendee intel (bio, role, prior threads, public activity, shared history) + a suggested agenda + the ONE thing not to forget.",
      "outcome": "Pre-read at meetings/{date}-{slug}-pre.md.",
      "skill": "brief",
      "tools": {
        "inbox": [
          "gmail"
        ],
        "calendar": [
          "googlecalendar"
        ],
        "messaging": [
          "slack"
        ],
        "files": [
          "googledrive"
        ],
        "meetings": [
          "fireflies",
          "gong"
        ]
      }
    },
    {
      "category": "Scheduling",
      "title": "Turn my last call into decisions + follow-ups",
      "blurb": "Decisions, owners, dates, quotes worth keeping.",
      "prompt": "Give me the post-meeting notes from my last call.",
      "fullPrompt": "Give me the post-meeting notes from my last meeting. Use the brief skill with mode=meeting-post. Pull the transcript from my connected Fireflies / Gong (or accept pasted transcript). Extract decisions made, owners + dates for every follow-up, open questions, and 2-4 verbatim quotes worth keeping. Flag any decision-shaped items as log-decision candidates. Save to meetings/{YYYY-MM-DD}-{slug}-post.md.",
      "description": "From your Fireflies / Gong transcript (or paste): decisions made, owners + dates for every follow-up, open questions, and quotes worth keeping.",
      "outcome": "Notes at meetings/{date}-{slug}-post.md.",
      "skill": "brief",
      "tools": {
        "inbox": [
          "gmail"
        ],
        "calendar": [
          "googlecalendar"
        ],
        "messaging": [
          "slack"
        ],
        "files": [
          "googledrive"
        ],
        "meetings": [
          "fireflies",
          "gong"
        ]
      }
    },
    {
      "category": "Scheduling",
      "title": "Book a meeting with someone — 3 times proposed",
      "blurb": "Respects focus blocks. Draft outreach. No surprise events.",
      "prompt": "Book a 30-min meeting with {name} next week.",
      "fullPrompt": "Book a 30-min meeting with {name}. Use the schedule-meeting skill. Propose 3 times that respect my focus blocks, buffers, and max-meetings-per-day. Draft the counterparty message in my voice. Iterate on back-and-forth if needed. Create the event in Google Calendar ONLY after my explicit approval.",
      "description": "I propose 3 times that respect your focus blocks and max-meetings-per-day, draft the outreach in your voice, and create the event only after you approve.",
      "outcome": "Proposal at meetings/{slug}-proposal.md. Event created only after approval.",
      "skill": "schedule-meeting",
      "tools": {
        "calendar": [
          "googlecalendar"
        ],
        "inbox": [
          "gmail",
          "outlook"
        ]
      }
    },
    {
      "category": "Scheduling",
      "title": "Plan a trip end-to-end",
      "blurb": "Itinerary draft + flight/hotel criteria + packing list.",
      "prompt": "I'm going to {city} next week — plan the trip.",
      "fullPrompt": "Plan my upcoming trip to {city}. Use the coordinate-travel skill. Read my travel prefs (ask once if missing). Assemble: trip summary, itinerary draft with flight + hotel search criteria, and a destination-adapted packing checklist. Save to trips/{slug}/. Never books — drafts only.",
      "description": "Trip summary + itinerary draft with flight and hotel criteria + a destination-adapted packing checklist. Drafts only, never books.",
      "outcome": "Draft at trips/{slug}/.",
      "skill": "coordinate-travel",
      "tools": {
        "inbox": [
          "gmail"
        ],
        "calendar": [
          "googlecalendar"
        ]
      }
    },
    {
      "category": "Scheduling",
      "title": "Draft replies to the inbound emails",
      "blurb": "Your voice, saved as inbox drafts — you send.",
      "prompt": "Draft replies to my needs-me inbox threads.",
      "fullPrompt": "Draft replies to my needs-me inbox threads. Use the draft-message skill with type=reply. Pull threads from Gmail / Outlook, draft in my voice (from config/voice.md), save each as a draft in the inbox provider, and write the human-readable record to drafts/reply-{YYYY-MM-DD}-{slug}.md. Never sends.",
      "description": "I pull your needs-me threads, draft replies in your voice from config/voice.md, and save each as a draft in Gmail / Outlook. You approve and send.",
      "outcome": "Drafts at drafts/reply-{date}-{slug}.md + drafts in your inbox.",
      "skill": "draft-message",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ]
      }
    },
    {
      "category": "Scheduling",
      "title": "Track this follow-up so I don't drop it",
      "blurb": "Who / what / by when. Surfaced when due.",
      "prompt": "Track this follow-up: I promised {X} to {name} by {date}.",
      "fullPrompt": "Track this follow-up. Use the draft-message skill with type=followup (TRACK sub-mode). Extract who owes what to whom by when, append to followups.json. When the due date arrives I'll surface it and — when you say 'handle due follow-ups' — draft the fulfillment or an honest bump.",
      "description": "I log the commitment (who / what / by when) to followups.json. On the due date I surface it; when you say 'handle due follow-ups' I draft the fulfillment or an honest bump.",
      "outcome": "Row in followups.json.",
      "skill": "draft-message",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ]
      }
    },
    {
      "category": "Finance",
      "title": "Audit my SaaS spend — what am I paying for?",
      "blurb": "Stripe + contracts + inbox receipts. Cancel candidates.",
      "prompt": "Audit my SaaS spend.",
      "fullPrompt": "Audit my SaaS spend. Use the audit-saas-spend skill. Aggregate subscriptions from my contracts/ folder, connected Stripe, and inbox receipts (Gmail / Outlook). Flag duplicates, unused tools, and rank the top cancel candidates by annual cost × low-usage signal. Save to saas-audits/{YYYY-MM-DD}.md.",
      "description": "I aggregate subscriptions from your contracts folder, Stripe, and inbox receipts. Flag duplicates, unused tools, and rank top cancel candidates by annual cost × low-usage signal.",
      "outcome": "Audit at saas-audits/{date}.md with ranked cancel candidates.",
      "skill": "audit-saas-spend",
      "tools": {
        "billing": [
          "stripe"
        ],
        "inbox": [
          "gmail",
          "outlook"
        ]
      }
    },
    {
      "category": "Finance",
      "title": "Build my renewal calendar",
      "blurb": "Renewal dates + notice windows + auto-renew language.",
      "prompt": "Build my renewal calendar for the year.",
      "fullPrompt": "Build my renewal calendar. Use the track-renewals skill. Scan contracts/ and any connected Google Drive folder, extract renewal dates + notice windows + auto-renew language. Maintain the living renewals/calendar.md and a per-quarter digest at renewals/{yyyy-qq}.md.",
      "description": "I scan your contracts folder and Google Drive, extract renewal dates + notice windows + auto-renew language, and maintain a living calendar + per-quarter digest.",
      "outcome": "Living calendar at renewals/calendar.md + per-quarter digest.",
      "skill": "track-renewals",
      "tools": {
        "files": [
          "googledrive"
        ]
      }
    },
    {
      "category": "Finance",
      "title": "Pull the auto-renew clauses from every contract",
      "blurb": "Verbatim quotes + plain-language summary + flags.",
      "prompt": "Pull the auto-renew language from every contract in {folder}.",
      "fullPrompt": "Extract the auto-renew language from every contract in {folder}. Use the extract-contract-clauses skill. Parse each contract, extract the clause with a verbatim quote + plain-language summary + flag if the notice window is onerous or the auto-renew is silent. Also update the renewal calendar.",
      "description": "I parse each contract, extract the clause verbatim + plain-language summary + flag onerous notice windows. Also updates your renewal calendar.",
      "outcome": "Per-contract extracts and an updated renewals/calendar.md.",
      "skill": "extract-contract-clauses",
      "tools": {
        "files": [
          "googledrive"
        ]
      }
    },
    {
      "category": "Finance",
      "title": "Draft a renewal-negotiation email",
      "blurb": "Grounded in contract terms + usage + your posture.",
      "prompt": "Draft a renewal-negotiation email for {vendor}.",
      "fullPrompt": "Draft a renewal-negotiation email for {vendor}. Use the draft-message skill with type=vendor (sub-type=renewal). Ground in contract terms from contracts/{vendor}/ and my vendor posture from context/operations-context.md (risk appetite, signature authority, paper preference). Lead with data, specific ask, walk-away. Save as inbox draft + drafts/vendor-renewal-{vendor}.md.",
      "description": "Grounded in the contract terms + your vendor posture: lead with data, specific ask (price, term), clean walk-away. Saved as an inbox draft — you approve and send.",
      "outcome": "Draft at drafts/vendor-renewal-{vendor}.md + inbox draft.",
      "skill": "draft-message",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ]
      }
    },
    {
      "category": "Finance",
      "title": "Draft the cancel email for a SaaS",
      "blurb": "Direct, grateful, cites the clause + effective date.",
      "prompt": "Write the cancel email for {SaaS}.",
      "fullPrompt": "Write the cancel email for {SaaS}. Use the draft-message skill with type=vendor (sub-type=cancel). Direct, grateful, cites the cancellation clause + effective date from the contract. Save as an inbox draft + drafts/vendor-cancel-{vendor}.md.",
      "description": "Direct, grateful, and specific — cites the cancellation clause and effective date from the contract. Saved as an inbox draft.",
      "outcome": "Draft at drafts/vendor-cancel-{vendor}.md + inbox draft.",
      "skill": "draft-message",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ]
      }
    },
    {
      "category": "Vendors",
      "title": "Evaluate a supplier against my criteria",
      "blurb": "Score 1-10, green/yellow/red, concerns, recommendation.",
      "prompt": "Evaluate {supplier} against our criteria.",
      "fullPrompt": "Evaluate {supplier} against our criteria. Use the evaluate-supplier skill. Rubric-based due-diligence. Score 1-10 on each criterion, risk tier green / yellow / red, strengths, concerns, first-call questions, and a clear recommendation. Save to evaluations/{supplier-slug}.md.",
      "description": "Rubric-based due-diligence: score 1-10 per criterion, risk tier green / yellow / red, strengths, concerns, first-call questions, and a recommendation.",
      "outcome": "Evaluation at evaluations/{supplier}.md.",
      "skill": "evaluate-supplier"
    },
    {
      "category": "Vendors",
      "title": "Compliance check — is this vendor clean?",
      "blurb": "Frameworks, named officers, incidents. Every claim cited.",
      "prompt": "Run a compliance check on {company}.",
      "fullPrompt": "Run a compliance check on {company}. Use the research-compliance skill. Public-source research via Exa / Perplexity / Firecrawl: frameworks held (SOC 2, ISO 27001, HIPAA, GDPR posture), named officers, recent incidents, litigation. Every claim cited with source URL. Save to compliance-reports/{company-slug}.md.",
      "description": "Public-source research via Exa / Perplexity / Firecrawl: frameworks held, named officers, recent incidents, litigation. Every claim cited with source URL.",
      "outcome": "Report at compliance-reports/{company}.md.",
      "skill": "research-compliance",
      "tools": {
        "search": [
          "exa",
          "perplexityai"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Vendors",
      "title": "Draft trial outreach to a supplier",
      "blurb": "Positioning fit + use case + success criteria + timeline.",
      "prompt": "Reach out to {supplier} for a trial.",
      "fullPrompt": "Reach out to {supplier} for a trial. Use the draft-message skill with type=vendor (sub-type=trial). Write: positioning fit + specific use case + success criteria + honest timeline. Save as an inbox draft + drafts/vendor-trial-{supplier}.md.",
      "description": "Positioning fit + specific use case + success criteria + honest timeline. Saved as an inbox draft.",
      "outcome": "Draft at drafts/vendor-trial-{supplier}.md + inbox draft.",
      "skill": "draft-message",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ]
      }
    },
    {
      "category": "Vendors",
      "title": "Reference-check email for a vendor",
      "blurb": "3-5 targeted questions keyed to what we're evaluating.",
      "prompt": "Draft a reference-check email for {vendor}.",
      "fullPrompt": "Draft a reference-check email for {vendor}. Use the draft-message skill with type=vendor (sub-type=reference-check). 3-5 targeted questions based on what we're evaluating against — not 'tell me about them.' Save as an inbox draft + drafts/vendor-reference-check-{vendor}.md.",
      "description": "3-5 targeted questions keyed to what we're evaluating — not 'tell me about them.' Saved as an inbox draft.",
      "outcome": "Draft at drafts/vendor-reference-check-{vendor}.md + inbox draft.",
      "skill": "draft-message",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ]
      }
    },
    {
      "category": "Vendors",
      "title": "Score this inbound against my criteria",
      "blurb": "Approve / decline / more-info with evidence per criterion.",
      "prompt": "Score this inbound {press / partnership / advisor} application.",
      "fullPrompt": "Score this inbound application. Use the run-approval-flow skill. Apply the rubric from my context/operations-context.md (priorities + key contacts + hard nos) to produce a scored approve / decline / more-info recommendation with evidence per criterion. Save to approvals/{kind}-{slug}.md.",
      "description": "I apply the rubric from your operating context to produce a scored approve / decline / more-info recommendation with evidence per criterion.",
      "outcome": "Scored decision at approvals/{kind}-{slug}.md.",
      "skill": "run-approval-flow"
    },
    {
      "category": "Data",
      "title": "Start tracking a metric",
      "blurb": "Read-only SQL + daily snapshot + registry entry.",
      "prompt": "Start tracking {metric} — watch it.",
      "fullPrompt": "Start tracking {metric}. Use the track-metric skill. Write the read-only SQL against my connected warehouse (Postgres / BigQuery / Snowflake via Composio), snapshot the current value into metrics-daily.json, append the definition to config/metrics.json, and register it for daily cadence.",
      "description": "I write the read-only SQL against your connected warehouse, snapshot the value daily into metrics-daily.json, and register the metric for tracking.",
      "outcome": "Entry in config/metrics.json + first snapshot in metrics-daily.json.",
      "skill": "track-metric"
    },
    {
      "category": "Data",
      "title": "Ask a data question — I'll write the SQL",
      "blurb": "Read-only, cost-warned, saved for reuse.",
      "prompt": "How many signups this week?",
      "fullPrompt": "Answer this data question: {question}. Use the run-sql-query skill. Translate to read-only SQL against my connected warehouse, lazy-introspect any unfamiliar tables into config/schemas.json, warn on cost BEFORE running, execute, save the query for reuse at queries/{slug}/, and return the result with caveats + a run timestamp.",
      "description": "I translate your question to read-only SQL against your connected warehouse, warn on cost before running, execute, save for reuse, and return the result with caveats.",
      "outcome": "Result + query saved to queries/{slug}/.",
      "skill": "run-sql-query"
    },
    {
      "category": "Data",
      "title": "Analyze an experiment — ship / kill / iterate",
      "blurb": "Lift + significance + CI + guardrails. Explicit call.",
      "prompt": "Analyze experiment {name} — how did it do?",
      "fullPrompt": "Analyze experiment {name}. Use the analyze skill with subject=experiment. Pull variant data from my connected warehouse or accept pasted aggregates. Compute lift, statistical significance, 95% CI, observed MDE, guardrail deltas. Make the call: SHIP / KILL / ITERATE / INCONCLUSIVE-EXTEND. Save to analyses/experiment-{slug}-{YYYY-MM-DD}.md. Never recommends SHIP without significance.",
      "description": "Lift + significance + CI + guardrails, with an explicit ship / kill / iterate / inconclusive-extend call. Never recommends SHIP without significance.",
      "outcome": "Readout at analyses/experiment-{slug}-{date}.md.",
      "skill": "analyze",
      "tools": {
        "analytics": [
          "posthog",
          "mixpanel"
        ]
      }
    },
    {
      "category": "Data",
      "title": "Daily anomaly sweep — anything weird?",
      "blurb": "Deviations past baseline + 1-3 hypothesized causes each.",
      "prompt": "Anomaly check — anything weird in the data?",
      "fullPrompt": "Run an anomaly sweep. Use the analyze skill with subject=anomaly. For each metric in config/metrics.json with ≥7 snapshots, compute 7-day and 28-day rolling baselines, flag deviations past the per-metric threshold or default (2σ yellow / 3σ red), and hypothesize 1-3 possible causes from recent decisions, deploys, and experiments. Save to analyses/anomaly-sweep-{YYYY-MM-DD}.md and upsert anomalies.json.",
      "description": "I compare every tracked metric against its 7-day and 28-day baselines, flag deviations past threshold, and hypothesize 1-3 causes for each.",
      "outcome": "Sweep at analyses/anomaly-sweep-{date}.md + rows in anomalies.json.",
      "skill": "analyze",
      "tools": {
        "analytics": [
          "posthog",
          "mixpanel"
        ]
      }
    },
    {
      "category": "Data",
      "title": "Check data quality on a table",
      "blurb": "Nulls, duplicates, freshness, referential integrity.",
      "prompt": "Run data QA on {table}.",
      "fullPrompt": "Run data QA on {table}. Use the analyze skill with subject=data-qa. Read-only checks: nulls per column, duplicates on natural key, freshness (MAX(updated_at) vs expected staleness), referential integrity on key joins, cardinality surprises. Save to data-quality-reports/{YYYY-MM-DD}/report.md with pass / warn / fail per check and a suggested fix per fail.",
      "description": "Read-only DQ checks on target tables: nulls per column, duplicates on natural keys, freshness, referential integrity, cardinality drift.",
      "outcome": "Report at data-quality-reports/{date}/report.md.",
      "skill": "analyze",
      "tools": {
        "analytics": [
          "posthog",
          "mixpanel"
        ]
      }
    },
    {
      "category": "Data",
      "title": "Spec a dashboard I can actually build",
      "blurb": "Sections, viz, cadence, read-only SQL per viz.",
      "prompt": "Spec me a growth dashboard.",
      "fullPrompt": "Spec me a {topic} dashboard. Use the spec-dashboard skill. Propose sections, per-section visualizations (what chart, what it shows), cadence (live / daily / weekly / monthly), and the read-only SQL behind each viz. Save the spec to config/dashboards.json — you or your BI tool builds the rendered dashboard.",
      "description": "Sections, per-section visualizations, cadence, and the read-only SQL behind each viz — the spec, not the rendered dashboard.",
      "outcome": "Spec saved to config/dashboards.json.",
      "skill": "spec-dashboard"
    },
    {
      "category": "Data",
      "title": "The weekly metrics rollup",
      "blurb": "Every tracked metric, WoW change, classification, anomalies.",
      "prompt": "Give me the weekly metrics rollup.",
      "fullPrompt": "Give me the weekly metrics rollup. Use the run-review skill with period=metrics-rollup. Read every tracked metric from metrics-daily.json (last 14 snapshots each), compute week-over-week change and classification vs declared direction, flag any open anomaly from anomalies.json, and rank by biggest movement. Save to rollups/{YYYY-MM-DD}.md.",
      "description": "Cross-metric week-over-week pulse: every tracked metric, WoW change, classification vs direction, open anomalies. Ranked by biggest movement.",
      "outcome": "Rollup at rollups/{date}.md — top 3 movers called out.",
      "skill": "run-review",
      "tools": {
        "files": [
          "googlesheets"
        ]
      }
    },
    {
      "category": "Data",
      "title": "Weekly research brief on a topic",
      "blurb": "News + research + social synthesis. Every claim cited.",
      "prompt": "Research brief on {topic} — what's moving?",
      "fullPrompt": "Give me a research brief on {topic}. Use the synthesize-signal skill. News + deep research via Exa / Perplexity + social-feed scan via Firecrawl. Structured brief: what's moving, who's moving it, 3 implications for my company, 3 angles worth acting on. Every claim cited with source URL. Save to signals/{slug}-{YYYY-MM-DD}.md.",
      "description": "News + research + social synthesis via Exa / Perplexity / Firecrawl. Structured brief with what's moving, who's moving it, implications, and angles — every claim cited.",
      "outcome": "Brief at signals/{slug}-{date}.md.",
      "skill": "synthesize-signal",
      "tools": {
        "search": [
          "exa",
          "perplexityai"
        ],
        "scrape": [
          "firecrawl"
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
        console.warn("[marketing dashboard] sendMessage prop missing — tile click is a no-op.");
        return;
      }
      try {
        sendMessage(text);
      } catch (e) {
        console.error("[marketing dashboard] sendMessage threw:", e);
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
      // Eyebrow: category (· tool₁ · tool₂ · …)
      (function () {
        var flat = flattenToolNames(uc.tools, 4);
        var children = [h("span", { key: "cat" }, uc.category || "Mission")];
        flat.names.forEach(function (nm, i) {
          children.push(h("span", { key: "sep-" + i, className: "hv-eyebrow-sep" }, "·"));
          children.push(h("span", { key: "tool-" + i }, nm));
        });
        if (flat.extra > 0) {
          children.push(h("span", { key: "sep-more", className: "hv-eyebrow-sep" }, "·"));
          children.push(h("span", { key: "more" }, "… +" + flat.extra));
        }
        return h("div", { className: "hv-eyebrow" }, children);
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
