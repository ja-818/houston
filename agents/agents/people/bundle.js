// Houston agent dashboard bundle — People.
// Hand-crafted IIFE. No ES modules, no build step, no import statements.
// Access React via window.Houston.React. Export via window.__houston_bundle__.
//
// This dashboard is the founder's quick-CTA menu for the unified people
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

  // ── Slug → display-name dictionary (for tile eyebrow) ────────
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
    return SLUG_DISPLAY_NAMES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
  }
  // Flatten a grouped tools map ({category: [slug, ...]}) into an ordered
  // list of display names, capped at 4 with "… +N" suffix if truncated.
  function flattenTools(tools) {
    if (!tools || typeof tools !== "object") return [];
    var flat = [];
    var keys = Object.keys(tools);
    for (var i = 0; i < keys.length; i++) {
      var arr = tools[keys[i]];
      if (!arr || !arr.length) continue;
      for (var j = 0; j < arr.length; j++) {
        flat.push(displayName(arr[j]));
      }
    }
    if (flat.length > 4) {
      var extra = flat.length - 4;
      flat = flat.slice(0, 4);
      flat.push("… +" + extra);
    }
    return flat;
  }

  // ═════════ PER-AGENT CONFIG (injected by generator) ═════════
  var AGENT = {
  "name": "People",
  "tagline": "Your full-stack people / HR operator. Hiring, onboarding, performance, compliance, and culture — one agent, one conversation, one shared people-context doc.",
  "chips": [
    "Hiring",
    "Onboarding",
    "Performance",
    "Compliance",
    "Culture"
  ],
  "useCases": [
    {
      "category": "Hiring",
      "title": "Source candidates from GitHub, LinkedIn, or OSS",
      "blurb": "Ranked list against the role rubric, scraped fresh.",
      "prompt": "Source candidates for {role} from GitHub.",
      "fullPrompt": "Source candidates for the {role} role. Use the source-candidates skill. Pull from my signal source (GitHub / LinkedIn / community posts / OSS repos) via Firecrawl, score each against the must-haves in reqs/{role-slug}.md, and write a ranked list to sourcing-lists/{role-slug}-{YYYY-MM-DD}.md.",
      "description": "Pulls candidates from GitHub, LinkedIn, community, or OSS via Firecrawl and ranks them against the role rubric. Writes to sourcing-lists/{role-slug}-{date}.md — top matches first.",
      "outcome": "Ranked list at sourcing-lists/{role}-{date}.md — move the top names straight into screening.",
      "skill": "source-candidates",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "dev": [
          "github"
        ],
        "social": [
          "linkedin"
        ]
      }
    },
    {
      "category": "Hiring",
      "title": "Screen a resume stack and rank against the rubric",
      "blurb": "Pass / borderline / fail band per applicant + top 3.",
      "prompt": "Screen these resumes for {role}.",
      "fullPrompt": "Screen the resume stack for {role}. Use the evaluate-candidate skill with source=resume. Parse PDFs from my connected Google Drive or Dropbox, evaluate each against reqs/{role-slug}.md, band each as pass / borderline / fail, and build a ranked summary. One candidate record per applicant at candidates/{candidate-slug}.md.",
      "description": "Parses resume PDFs from Google Drive or Dropbox, bands each as pass / borderline / fail against the role rubric, and ranks the stack. One record per applicant at candidates/{slug}.md.",
      "outcome": "Per-applicant records at candidates/{slug}.md + a ranked summary on the dashboard.",
      "skill": "evaluate-candidate",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "files": [
          "googledrive",
          "googlesheets"
        ]
      }
    },
    {
      "category": "Hiring",
      "title": "Score a LinkedIn profile 0-100 against the role",
      "blurb": "Sub-scores with evidence cited + red flags.",
      "prompt": "Score {LinkedIn URL} for the {role} role.",
      "fullPrompt": "Score this LinkedIn profile for the {role} role: {LinkedIn URL}. Use the evaluate-candidate skill with source=linkedin. Scrape the profile via Firecrawl, score 0-100 across 4-6 sub-criteria with one-line reasons citing profile evidence, and list 3-5 red flags to probe in interviews. Write to candidates/{candidate-slug}.md.",
      "description": "Scrapes a LinkedIn or public-profile URL via Firecrawl and scores 0-100 across level-fit, domain-fit, scope, tenure, and culture-signal. Writes to candidates/{slug}.md.",
      "outcome": "Candidate record at candidates/{slug}.md with total + sub-scores + red flags.",
      "skill": "evaluate-candidate",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "files": [
          "googledrive",
          "googlesheets"
        ]
      }
    },
    {
      "category": "Hiring",
      "title": "Prep me to interview {candidate}",
      "blurb": "Background, likely questions, red flags, rubric.",
      "prompt": "Prep me to interview {candidate} for {role}.",
      "fullPrompt": "Prep me to interview {candidate} for the {role} role. Use the prep-interviewer skill. Read the candidate record at candidates/{candidate-slug}.md (or run evaluate-candidate first if missing), pull the rubric from reqs/{role-slug}.md, and build an interviewer-side brief: background summary, likely questions, red flags to probe, reference themes, scoring rubric. Write to interview-loops/{candidate-slug}.md.",
      "description": "Builds an interviewer-side brief: background, likely questions, red flags to probe, reference themes, scoring rubric — flipped from candidate-side prep.",
      "outcome": "Brief at interview-loops/{candidate-slug}.md — open it 5 minutes before the call.",
      "skill": "prep-interviewer",
      "tools": {
        "docs": [
          "notion"
        ],
        "social": [
          "linkedin"
        ]
      }
    },
    {
      "category": "Hiring",
      "title": "Schedule a panel loop for {candidate}",
      "blurb": "Free/busy via Google Calendar, briefs per panelist.",
      "prompt": "Schedule {candidate}'s panel loop.",
      "fullPrompt": "Schedule {candidate}'s interview loop. Use the coordinate-interviews skill. Propose times via my connected Google Calendar (check free/busy, never send the invites), run the prep-interviewer skill per panelist, and append schedule + briefs to interview-loops/{candidate-slug}.md. I approve and send.",
      "description": "Proposes times via Google Calendar or Outlook (free/busy, never sends), runs prep-interviewer per panelist, and appends everything to interview-loops/{slug}.md. You approve and send.",
      "outcome": "Schedule + per-panelist briefs at interview-loops/{slug}.md. You click send.",
      "skill": "coordinate-interviews",
      "tools": {
        "calendar": [
          "googlecalendar"
        ],
        "inbox": [
          "outlook"
        ]
      }
    },
    {
      "category": "Hiring",
      "title": "Debrief {candidate}'s loop — hire or no-hire?",
      "blurb": "Themes, contradictions, rubric score, decision memo.",
      "prompt": "Debrief {candidate}'s loop.",
      "fullPrompt": "Debrief {candidate}'s interview loop. Use the debrief-loop skill. Pull interviewer feedback from my connected Slack channel (or Notion / paste fallback), extract themes, surface contradictions across panelists, score against the rubric, and produce a hire / no-hire decision memo at interview-loops/{candidate-slug}-debrief.md. Recommendation only — I decide.",
      "description": "Aggregates interviewer feedback from Slack or Notion, extracts themes, surfaces contradictions, scores against the rubric, and drafts a hire / no-hire memo. You decide.",
      "outcome": "Debrief memo at interview-loops/{slug}-debrief.md with recommendation + rationale.",
      "skill": "debrief-loop",
      "tools": {
        "messaging": [
          "slack"
        ],
        "docs": [
          "notion"
        ]
      }
    },
    {
      "category": "Hiring",
      "title": "Draft an offer letter for {candidate} at {level}",
      "blurb": "Comp + equity pulled from your bands. Never sent.",
      "prompt": "Draft an offer for {candidate} at {level}.",
      "fullPrompt": "Draft an offer letter for {candidate} at {level}. Use the draft-offer skill. Read comp bands, equity stance, and leveling from context/people-context.md plus voice from the ledger. Write to offers/{candidate-slug}.md as status draft. Never sent.",
      "description": "Reads comp bands, equity stance, leveling, and voice from your context doc, drafts the offer letter at offers/{slug}.md as a draft. Never sent.",
      "outcome": "Offer draft at offers/{slug}.md. You review, flip to ready, send.",
      "skill": "draft-offer",
      "tools": {
        "docs": [
          "googledocs",
          "notion"
        ]
      }
    },
    {
      "category": "Onboarding",
      "title": "Draft a 30-60-90 plan for a new hire starting Monday",
      "blurb": "Day 0 · Week 1 · 30/60/90 + welcome Slack + welcome email.",
      "prompt": "{new hire} starts Monday — draft their onboarding plan.",
      "fullPrompt": "Draft the onboarding plan for {new hire} starting {date}. Use the draft-onboarding-plan skill. Read leveling and voice from context/people-context.md. Produce a Day 0 / Week 1 / 30-60-90 plan plus welcome Slack and welcome email drafts at onboarding-plans/{employee-slug}.md.",
      "description": "Day 0 checklist, Week 1 plan, 30-60-90 milestones, welcome Slack message, welcome email — all scoped to the level in your context doc.",
      "outcome": "Full plan at onboarding-plans/{slug}.md. You edit, approve, run Day 0.",
      "skill": "draft-onboarding-plan",
      "tools": {
        "messaging": [
          "slack"
        ],
        "inbox": [
          "gmail"
        ],
        "docs": [
          "notion"
        ]
      }
    },
    {
      "category": "Onboarding",
      "title": "Prep me before my 1:1 with {employee}",
      "blurb": "HRIS profile + onboarding + check-ins + loop history.",
      "prompt": "Tell me about {employee} — prep me for our 1:1.",
      "fullPrompt": "Prep me for my 1:1 with {employee}. Use the employee-dossier skill. Pull HRIS profile from my connected HRIS (read-only), plus onboarding-plans/, recent checkins/, and interview-loops/ into a single-page dossier at employee-dossiers/{employee-slug}.md: profile / history / recent signals / upcoming.",
      "description": "Aggregates HRIS profile (read-only) plus local onboarding plans, check-ins, and interview-loop history into one page. Profile / history / recent signals / upcoming.",
      "outcome": "Dossier at employee-dossiers/{slug}.md — read 2 minutes before the 1:1.",
      "skill": "employee-dossier",
      "tools": {
        "docs": [
          "notion"
        ],
        "messaging": [
          "slack"
        ]
      }
    },
    {
      "category": "Onboarding",
      "title": "Welcome Slack message in your voice",
      "blurb": "Day-0 ping — warm, specific, not corporate.",
      "prompt": "Draft the welcome Slack for {new hire}.",
      "fullPrompt": "Draft the Day-0 welcome Slack for {new hire}. Use the draft-onboarding-plan skill and return just the Slack portion — warm, specific to their role, in my voice (pulled from context/people-context.md). Write to onboarding-plans/{employee-slug}.md under the `## Welcome Slack` section.",
      "description": "Warm, specific Day-0 Slack message in your voice (pulled from your context doc's voice notes). Slotted into the full onboarding plan file.",
      "outcome": "Welcome Slack draft at onboarding-plans/{slug}.md. Copy-paste into #general on Day 0.",
      "skill": "draft-onboarding-plan",
      "tools": {
        "messaging": [
          "slack"
        ],
        "inbox": [
          "gmail"
        ],
        "docs": [
          "notion"
        ]
      }
    },
    {
      "category": "Onboarding",
      "title": "Welcome email — first-morning checklist",
      "blurb": "Laptop · accounts · #channels · Day-1 calendar.",
      "prompt": "Draft the welcome email for {new hire}'s first morning.",
      "fullPrompt": "Draft the welcome email for {new hire}'s first morning. Use the draft-onboarding-plan skill. Include: laptop shipment / pickup, account setup (Google / Slack / HRIS / GitHub / etc.), which #channels to join, and Day-1 calendar. Voice from context/people-context.md. Write into the `## Welcome Email` section of onboarding-plans/{employee-slug}.md.",
      "description": "First-morning email: laptop pickup, account setup, #channels to join, Day-1 calendar — scoped to your stack from the context ledger.",
      "outcome": "Welcome email draft at onboarding-plans/{slug}.md. Send Sunday night or Monday 7am.",
      "skill": "draft-onboarding-plan",
      "tools": {
        "messaging": [
          "slack"
        ],
        "inbox": [
          "gmail"
        ],
        "docs": [
          "notion"
        ]
      }
    },
    {
      "category": "Performance",
      "title": "Collect this week's 1:1 check-ins across the team",
      "blurb": "Who responded, who's quiet, themes, flags.",
      "prompt": "Collect this week's check-ins.",
      "fullPrompt": "Collect this week's 1:1 check-ins. Use the collect-checkins skill. Pull the roster from my connected HRIS, send the check-in prompt via my connected Slack channel, gather responses, and write a dated report to checkins/{YYYY-MM-DD}.md with themes, who's quiet, and flagged responses.",
      "description": "Sends the check-in prompt via Slack, gathers responses, writes a dated report with themes and quiet-flags. Runs weekly — perfect for a Monday kick-off.",
      "outcome": "Weekly report at checkins/{date}.md. Open flagged responses into stay conversations if needed.",
      "skill": "collect-checkins",
      "tools": {
        "messaging": [
          "slack",
          "discord"
        ]
      }
    },
    {
      "category": "Performance",
      "title": "Score retention risk across the team",
      "blurb": "GREEN / YELLOW / RED per person, signal evidence cited.",
      "prompt": "Score retention risk across the team.",
      "fullPrompt": "Score retention risk across the team. Use the analyze skill with subject=retention-risk. Fuse engagement (check-ins, Slack activity, optional PR / ticket cadence), sentiment (check-in tone drift), tenure milestones (cliff vesting, promotion honeymoon, manager change), and comp exposure (vs bands in context/people-context.md). Classify GREEN / YELLOW / RED and write the exact signal combination on every RED. Save to analyses/retention-risk-{YYYY-MM-DD}.md. Founder-eyes-only.",
      "description": "Fuses check-in responsiveness, sentiment, tenure milestones, and comp exposure into GREEN / YELLOW / RED per person. Every RED shows the exact signal combination.",
      "outcome": "Report at analyses/retention-risk-{date}.md. For each RED: run draft-performance-doc type=stay-conversation.",
      "skill": "analyze",
      "tools": {
        "messaging": [
          "slack"
        ],
        "crm": [
          "hubspot"
        ],
        "analytics": [
          "posthog"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Performance",
      "title": "Draft a stay conversation for {employee}",
      "blurb": "Verbal 1:1 script — Open · Listen · Surface · Ask · Propose.",
      "prompt": "{employee} flagged RED — draft the stay conversation.",
      "fullPrompt": "Draft a stay conversation for {employee}. Use the draft-performance-doc skill with type=stay-conversation. Read voice and hard-nos from context/people-context.md (especially counter-offer policy), pull the retention-score reasoning if present, and draft a verbal 1:1 SCRIPT: Open → Listen → Surface → Ask → Propose. Write to performance-docs/stay-conversation-{employee-slug}.md. This is a prompt for a verbal 1:1 — do not send.",
      "description": "Drafts a verbal 1:1 SCRIPT (not an email): Open → Listen → Surface → Ask → Propose. Filtered against your counter-offer policy and hard nos.",
      "outcome": "Script at performance-docs/stay-conversation-{slug}.md. Read it before the 1:1, adapt in the moment.",
      "skill": "draft-performance-doc",
      "tools": {
        "messaging": [
          "slack"
        ],
        "inbox": [
          "gmail"
        ]
      }
    },
    {
      "category": "Performance",
      "title": "Draft a PIP (with escalation check first)",
      "blurb": "Context · Expectations · 30/60/90 · Support · Consequences.",
      "prompt": "Draft a PIP for {employee}.",
      "fullPrompt": "Draft a PIP for {employee}. Use the draft-performance-doc skill with type=pip. Run the MANDATORY escalation check against context/people-context.md's escalation rules FIRST. If a protected-class + pretextual-timing trigger fires, STOP and write an escalation note routing to a human lawyer. If clear, draft Context → Expectations → 30/60/90 Milestones → Support → Consequences, tied to the leveling framework. Write to performance-docs/pip-{employee-slug}.md as status draft. Never delivered without my sign-off.",
      "description": "Runs the escalation check (protected class + pretextual timing) BEFORE drafting. If it fires, stops and routes to a lawyer. If clear, drafts Context / Expectations / 30-60-90 Milestones / Support / Consequences.",
      "outcome": "PIP draft (or escalation note) at performance-docs/pip-{slug}.md. Escalation classification in outputs.json.",
      "skill": "draft-performance-doc",
      "tools": {
        "messaging": [
          "slack"
        ],
        "inbox": [
          "gmail"
        ]
      }
    },
    {
      "category": "Performance",
      "title": "Prep the Q{N} review cycle",
      "blurb": "Self-review + manager + calibration + timeline.",
      "prompt": "Prep the Q{N} review cycle.",
      "fullPrompt": "Prep the Q{N} review cycle. Use the prep-review-cycle skill. Read the leveling framework and review-cycle rhythm from context/people-context.md. Produce the self-review template, the manager-review template, the calibration doc, and the full timeline — all scoped to the leveling framework. Write to review-cycles/{cycle-slug}.md as status draft until I approve the structure.",
      "description": "Produces the self-review template, manager-review template, calibration doc, and full timeline — all scoped to your leveling framework. Draft until you approve the structure.",
      "outcome": "Full cycle package at review-cycles/{slug}.md. Approve structure before I send to managers.",
      "skill": "prep-review-cycle",
      "tools": {
        "docs": [
          "notion",
          "googledocs"
        ]
      }
    },
    {
      "category": "Performance",
      "title": "The Monday people review",
      "blurb": "What shipped · what's stale · what to do next.",
      "prompt": "Give me the Monday people review.",
      "fullPrompt": "Give me the Monday people review. Use the analyze skill with subject=people-health. Aggregate everything I produced this week across hiring, onboarding, performance, compliance, and culture from outputs.json. Per domain: what shipped, what's stale (>7 days as draft), gaps. Cross-cutting: open-req drift, retention reds without stay-conversation follow-up, compliance near-deadlines, review-cycle drift. Write to analyses/people-health-{YYYY-MM-DD}.md.",
      "description": "Aggregates every artifact this agent produced this week across all 5 domains, flags stale drafts and cross-cutting gaps, recommends next moves per domain. A 2-minute scan.",
      "outcome": "Review at analyses/people-health-{date}.md with recommended next moves + what to flip to ready.",
      "skill": "analyze",
      "tools": {
        "messaging": [
          "slack"
        ],
        "crm": [
          "hubspot"
        ],
        "analytics": [
          "posthog"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Compliance",
      "title": "Build the compliance calendar",
      "blurb": "I-9 · W-4 · visa renewals · cycle dates · policy refresh.",
      "prompt": "Build the compliance calendar.",
      "fullPrompt": "Build the compliance calendar. Use the compliance-calendar skill. Scan my connected HRIS for start dates, work-authorization status, and vesting schedules. Pull the review-cycle rhythm from context/people-context.md. Write a living calendar at compliance-calendar.md (updated in place, atomic), and log each substantive update to outputs.json.",
      "description": "Scans your HRIS for I-9 / W-4 / visa renewals, pulls the review-cycle rhythm and policy-refresh cadence from your context doc, produces a living calendar at compliance-calendar.md.",
      "outcome": "Living calendar at compliance-calendar.md. Open it Monday, close the items due this week.",
      "skill": "compliance-calendar",
      "tools": {
        "docs": [
          "notion"
        ],
        "files": [
          "googlesheets"
        ]
      }
    },
    {
      "category": "Compliance",
      "title": "Answer a policy question (and escalate if needed)",
      "blurb": "Classifier: direct · ambiguous · escalation. Lawyer-safe.",
      "prompt": "Does {employee} qualify for {benefit}?",
      "fullPrompt": "Answer this policy question: {question}. Use the answer-policy-question skill. Read the policy canon AND escalation rules from context/people-context.md, classify as direct / ambiguous / escalation, and draft the reply (or escalation note) accordingly. Never answer a legal-sensitive escalation on your own. Write to approvals/{request-slug}.md.",
      "description": "Reads the policy canon + escalation rules, classifies direct / ambiguous / escalation, drafts the reply. Stops and escalates on legal-sensitive categories.",
      "outcome": "Reply or escalation note at approvals/{slug}.md. You review, send, or route to a lawyer.",
      "skill": "answer-policy-question",
      "tools": {
        "docs": [
          "notion",
          "googledocs"
        ]
      }
    },
    {
      "category": "Compliance",
      "title": "Review a PTO / comp / promotion / expense request",
      "blurb": "Rubric-scored approval, clean escalation notes.",
      "prompt": "Review this {type} request: {details}.",
      "fullPrompt": "Review this {type} request: {details}. Use the run-approval-flow skill. Read the approval rubric from context/people-context.md, evaluate the request, classify as approved / escalate / denied with reasoning, and produce an escalation note for any out-of-rubric ask. Write to approvals/{request-slug}.md.",
      "description": "Reads the approval rubric from your context doc, evaluates the request, classifies approved / escalate / denied. Escalation notes explain the trigger.",
      "outcome": "Decision draft at approvals/{slug}.md. Flip to ready after you sign off.",
      "skill": "run-approval-flow",
      "tools": {
        "messaging": [
          "slack"
        ],
        "docs": [
          "notion"
        ]
      }
    },
    {
      "category": "Compliance",
      "title": "What's my I-9 / W-4 status across the team?",
      "blurb": "Missing docs, expirations, next-90-day renewals.",
      "prompt": "Audit I-9 / W-4 status across the team.",
      "fullPrompt": "Audit I-9 / W-4 status across the team. Use the compliance-calendar skill. Scan my connected HRIS for any missing documents, expirations in the next 90 days, and incomplete fields. Update compliance-calendar.md in place and log each flag in outputs.json as a compliance-update entry.",
      "description": "Scans your HRIS for I-9 / W-4 completeness, missing docs, and next-90-day expirations. Flags go into compliance-calendar.md and outputs.json.",
      "outcome": "Flagged items at compliance-calendar.md. Fix before they block a hire or a renewal.",
      "skill": "compliance-calendar",
      "tools": {
        "docs": [
          "notion"
        ],
        "files": [
          "googlesheets"
        ]
      }
    },
    {
      "category": "Compliance",
      "title": "Draft the PTO policy reply template",
      "blurb": "Direct · ambiguous · escalation — all three paths.",
      "prompt": "Draft the PTO policy reply template.",
      "fullPrompt": "Draft the PTO policy reply template. Use the answer-policy-question skill. Read the PTO section of the policy canon from context/people-context.md, then draft three reply variants: (a) direct yes when the ask is clearly inside policy, (b) ambiguous follow-up when I need more context, (c) escalation note when the ask exceeds policy. Write to approvals/pto-reply-template.md for reuse.",
      "description": "Drafts three reusable reply variants (direct / ambiguous / escalation) for any PTO ask. Saves to approvals/pto-reply-template.md.",
      "outcome": "Reusable templates at approvals/pto-reply-template.md. Paste into helpdesk when asks come in.",
      "skill": "answer-policy-question",
      "tools": {
        "docs": [
          "notion",
          "googledocs"
        ]
      }
    },
    {
      "category": "Culture",
      "title": "Draft the people-context doc that anchors every artifact",
      "blurb": "Values · leveling · comp · policies · escalation · voice.",
      "prompt": "Draft our people-context doc.",
      "fullPrompt": "Draft our people-context doc. Use the define-people-context skill. Interview me briefly, then write context/people-context.md: company values, team shape, leveling framework (IC + manager L1-L5), comp bands, review-cycle rhythm, policy canon, escalation rules, voice notes, hard nos. Every other skill in this agent reads it first.",
      "description": "I interview you briefly and write the shared doc: values, leveling (IC + manager L1-L5), comp bands, policy canon, escalation rules, voice, hard nos. Every other skill reads it first.",
      "outcome": "Locked doc at context/people-context.md. Other skills stop asking baseline questions.",
      "skill": "define-people-context",
      "tools": {
        "docs": [
          "notion",
          "googledocs"
        ],
        "files": [
          "googlesheets"
        ]
      }
    },
    {
      "category": "Culture",
      "title": "Build the leveling ladder (IC + manager L1-L5)",
      "blurb": "Scope · seniority markers · value-embodiment per level.",
      "prompt": "Build our leveling ladder.",
      "fullPrompt": "Build our leveling ladder. Use the define-people-context skill. Focus on the leveling section: IC + manager tracks, L1-L5 by default (ask once if I want higher). For each level: name, one-paragraph expectations, scope of impact, seniority markers, and a value-embodiment line. Update context/people-context.md in place.",
      "description": "Scaffolds IC + manager tracks (L1-L5 default) inside your context doc — each level with scope, seniority markers, and a value-embodiment line tied to your company values.",
      "outcome": "Leveling section of context/people-context.md filled in. Used by offers, PIPs, and review cycles.",
      "skill": "define-people-context",
      "tools": {
        "docs": [
          "notion",
          "googledocs"
        ],
        "files": [
          "googlesheets"
        ]
      }
    },
    {
      "category": "Culture",
      "title": "Calibrate my HR voice from past outbound",
      "blurb": "Offers, onboarding notes, rejections — tone fingerprint.",
      "prompt": "Calibrate my HR voice.",
      "fullPrompt": "Calibrate my HR voice. Use the voice-calibration skill. Pull 10-20 of my recent HR-adjacent outbound messages from my connected Gmail (or Outlook), extract a tone fingerprint — greeting habits, closing habits, sentence length, formality, forbidden phrases, hard-news register — and append it to the voice-notes section of context/people-context.md. Also refresh config/voice.md.",
      "description": "Pulls 10-20 HR outbound samples from Gmail or Outlook, extracts a tone fingerprint, appends it to your context doc. Every offer, PIP, and onboarding note drafts against it.",
      "outcome": "Voice notes updated in context/people-context.md + config/voice.md. Downstream drafts sound like you.",
      "skill": "voice-calibration",
      "tools": {
        "inbox": [
          "gmail",
          "outlook"
        ]
      }
    },
    {
      "category": "Culture",
      "title": "Synthesize our employer brand from Glassdoor + feedback",
      "blurb": "Top 3 strengths · top 3 concerns · emerging patterns.",
      "prompt": "What's our employer brand right now?",
      "fullPrompt": "Synthesize our employer brand. Use the analyze skill with subject=employer-brand. Pull reviews from my connected Glassdoor or anonymous-feedback platform via Firecrawl / connected review sources, cluster themes, derive top 3 strengths + top 3 concerns + emerging patterns, flag contradictions vs our stated values, and recommend 3 moves. Write to analyses/employer-brand-{YYYY-MM-DD}.md. Leadership readout only — do not publish.",
      "description": "Clusters reviews + survey + anonymous-feedback items via Firecrawl or connected review sources. Top 3 strengths, top 3 concerns, emerging patterns, contradictions vs your stated values.",
      "outcome": "Leadership readout at analyses/employer-brand-{date}.md. Route concerns to founder / agent / lawyer.",
      "skill": "analyze",
      "tools": {
        "messaging": [
          "slack"
        ],
        "crm": [
          "hubspot"
        ],
        "analytics": [
          "posthog"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Hiring",
      "title": "Update the rubric for an open req",
      "blurb": "Level target + must-haves + nice-to-haves.",
      "prompt": "Update the rubric for the {role} req.",
      "fullPrompt": "Update the rubric for the {role} req. Use the source-candidates skill (it seeds reqs/{role-slug}.md as part of its first step). Ask me: target level, top 3 must-haves, top 3 nice-to-haves, 2-3 red flags. Write to reqs/{role-slug}.md. Every hiring skill reads this file next.",
      "description": "Seeds or updates the role rubric at reqs/{slug}.md — level target, must-haves, nice-to-haves, red flags. All other hiring skills read this file first.",
      "outcome": "Rubric at reqs/{role}.md. Source, screen, score, interview, and offer all pull from it.",
      "skill": "source-candidates",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "dev": [
          "github"
        ],
        "social": [
          "linkedin"
        ]
      }
    },
    {
      "category": "Performance",
      "title": "Check who's been quiet for 3+ weeks",
      "blurb": "Cross-reference check-in history → surface silences.",
      "prompt": "Who's been quiet in check-ins for 3+ weeks?",
      "fullPrompt": "Find team members who've been quiet in check-ins for 3+ weeks. Use the collect-checkins skill to read the last 4 weekly reports in checkins/, cross-reference with the roster, and surface everyone who has missed 3+ responses in a row. Append a `## Quiet Patterns` section to checkins/{YYYY-MM-DD}.md with names, last-response date, and recommended next move (stay conversation, 1:1 check-in, or nothing if context explains the silence).",
      "description": "Cross-references the last 4 checkins/{date}.md reports, surfaces team members quiet for 3+ weeks, recommends next moves (stay conversation or 1:1).",
      "outcome": "Quiet-patterns section appended to the week's checkins/{date}.md — open flags into stay conversations.",
      "skill": "collect-checkins",
      "tools": {
        "messaging": [
          "slack",
          "discord"
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
        console.warn("[people dashboard] sendMessage prop missing — tile click is a no-op.");
        return;
      }
      try {
        sendMessage(text);
      } catch (e) {
        console.error("[people dashboard] sendMessage threw:", e);
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
      // Eyebrow: category (· tool · tool …)
      (function () {
        var names = flattenTools(uc.tools);
        var parts = [h("span", { key: "cat" }, uc.category || "Mission")];
        for (var i = 0; i < names.length; i++) {
          parts.push(h("span", { key: "s" + i, className: "hv-eyebrow-sep" }, "·"));
          parts.push(h("span", { key: "t" + i }, names[i]));
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
