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

  // ─── Slug → display-name dictionary ─────────────────────────
  // Maps Composio app slugs to human display names for the tile
  // eyebrow. Falls back to title-casing the slug if absent.
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
    carta: "Carta", pulley: "Pulley",
  };
  function displayName(slug) {
    return SLUG_DISPLAY_NAMES[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1));
  }
  // Flattens a grouped tools map { category: [slug, ...] } to a list
  // of up to 4 display names, appending "… +N" if truncated.
  function flattenTools(tools) {
    if (!tools || typeof tools !== "object") return [];
    var slugs = [];
    var keys = Object.keys(tools);
    for (var i = 0; i < keys.length; i++) {
      var arr = tools[keys[i]];
      if (!arr || !arr.length) continue;
      for (var j = 0; j < arr.length; j++) slugs.push(arr[j]);
    }
    var cap = 4;
    if (slugs.length <= cap) return slugs.map(displayName);
    var shown = slugs.slice(0, cap).map(displayName);
    shown.push("… +" + (slugs.length - cap));
    return shown;
  }

  // ═════════ PER-AGENT CONFIG (injected by generator) ═════════
  var AGENT = {
  "name": "Engineering",
  "tagline": "Your full-stack engineering operator. Planning, triage, development quality, reliability, and docs \u2014 one agent, one conversation, one markdown output folder.",
  "chips": [
    "Planning",
    "Triage",
    "Development",
    "Reliability",
    "Docs"
  ],
  "useCases": [
    {
      "category": "Planning",
      "title": "Draft the engineering context every other skill reads first",
      "blurb": "Product, stack, architecture, quality bar, priorities.",
      "prompt": "Help me draft my engineering context doc.",
      "fullPrompt": "Help me draft (or update) my engineering context doc. Use the define-engineering-context skill. Interview me briefly (or read my connected GitHub) and write the full doc \u2014 product, stack, architecture, quality bar, team shape, current priorities, conventions \u2014 to context/engineering-context.md. Every other skill reads this first; until it exists, they stop and ask for it.",
      "description": "I walk you through a short interview (or read your connected GitHub) and draft the full engineering context doc \u2014 product, stack, architecture, quality bar, team, priorities, conventions. Every other skill in this agent reads it first.",
      "outcome": "A locked engineering context at context/engineering-context.md. Every skill that plans, reviews, audits, or documents reads it.",
      "skill": "define-engineering-context",
      "tools": {
        "dev": [
          "github",
          "gitlab",
          "linear",
          "jira"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "Draft the Q{n} roadmap \u2014 top 3 priorities, sized",
      "blurb": "Top 3 priorities, S/M/L, rationale, dependencies.",
      "prompt": "Draft the Q{n} engineering roadmap \u2014 top 3 priorities.",
      "fullPrompt": "Draft the Q{n} engineering roadmap. Use the plan-roadmap skill. Read context/engineering-context.md for current priorities and cross-check outputs.json for in-flight work you shouldn't re-plan. Pick the top 3 priorities for the quarter, size each S/M/L, state rationale, list dependencies. Markdown, not a Gantt. Save to roadmaps/q{n}-{year}.md. Close with one paragraph on what I should say no to this quarter to protect the top 3.",
      "description": "I read the engineering context + every artifact in this agent's outputs.json, then write the quarterly roadmap with top 3 priorities, sizing, rationale, and dependencies.",
      "outcome": "A roadmap at roadmaps/q{n}-{year}.md I can paste to the team or share with investors.",
      "skill": "plan-roadmap",
      "tools": {
        "dev": [
          "github",
          "linear",
          "jira"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "Validate this feature before I build it",
      "blurb": "Market-fit gate with evidence before a roadmap commit.",
      "prompt": "Before I build {feature}, validate it against real market signal.",
      "fullPrompt": "Validate {feature} before I commit roadmap effort. Use the validate-feature-fit skill. I'll give you the idea, the target audience, and the problem statement. Scrape the competitor landscape via Firecrawl + Exa, check what's already shipping for this audience, and pull any adjacent customer-language signal you can find. Produce a verdict (build / defer / skip) with evidence. Save to feature-fit/{slug}.md. Flag the assumptions you couldn't test from the desk.",
      "description": "I scrape competitor activity via Firecrawl and web search, assess alignment to observable demand, and produce a verdict + evidence \u2014 so feature bets stop being shower thoughts.",
      "outcome": "A verdict at feature-fit/{slug}.md with evidence. Forward to plan-roadmap if it's a go.",
      "skill": "validate-feature-fit",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "search": [
          "exa",
          "perplexityai"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "Plan this week's sprint \u2014 what's in, what's cut",
      "blurb": "Top-N in, top-M cut, velocity check, risks.",
      "prompt": "Plan this week's sprint across Linear.",
      "fullPrompt": "Plan this week's sprint. Use the plan-sprint skill. Pull my open tickets from the connected Linear, Jira, or GitHub Issues; rank against priorities in context/engineering-context.md. Produce a time-boxed plan: top-N tickets in (with rationale), top-M cut (with rationale), velocity check vs last 2-3 sprints, dependencies, risks. Save to sprints/{YYYY-WNN}.md.",
      "description": "I pull open tickets from Linear / Jira / GitHub Issues, rank against priorities in the engineering context, and write a time-boxed plan with in/cut rationale, velocity check, dependencies, and risks.",
      "outcome": "A sprint plan at sprints/{YYYY-WNN}.md \u2014 paste into your tracker's sprint.",
      "skill": "plan-sprint",
      "tools": {
        "dev": [
          "linear",
          "jira",
          "github"
        ]
      }
    },
    {
      "category": "Planning",
      "title": "Coordinate a cross-phase release",
      "blurb": "Sequenced checklist across design, ship, ops, docs.",
      "prompt": "Coordinate the {feature} release across design, ship, ops, docs.",
      "fullPrompt": "Coordinate the {feature} release. Use the coordinate-release skill. Break the release into a sequenced checklist across phases: Design (draft-design-doc done?), Ship (review-deploy-readiness GREEN? review-pr done on the PRs?), Ops (draft-runbook written? audit observability?), Docs (write-release-notes drafted? write-docs tutorial?). For every phase, write an exact copy-paste prompt I can send to trigger the relevant skill. Flag the critical path. Save to release-plans/{feature-slug}.md.",
      "description": "I break the release into a sequenced per-phase checklist (design ready? deploy plan? tests green? runbook? release notes? user docs?) with exact copy-paste prompts for the skills in this agent that execute each phase.",
      "outcome": "A release plan at release-plans/{feature-slug}.md with a checklist per phase.",
      "skill": "coordinate-release"
    },
    {
      "category": "Planning",
      "title": "Monday engineering health review",
      "blurb": "Shipped / In Progress / Blocked / Decisions Needed.",
      "prompt": "Give me the Monday engineering review across every domain.",
      "fullPrompt": "Give me the Monday engineering review. Use the analyze skill with subject=engineering-health. Aggregate everything in outputs.json from the last 7 days, grouped by domain (planning / triage / development / reliability / docs). For each domain, name what shipped, what's stale, what's blocked. Close with a prioritized list of decisions I need to make this week, each with a paste-ready follow-up prompt. Save to reviews/{YYYY-MM-DD}.md.",
      "description": "I aggregate everything this agent produced this week across all 5 domains from outputs.json, flag gaps, recommend next moves, and list the decisions you need to make this week. A 2-minute scan.",
      "outcome": "Review at reviews/{YYYY-MM-DD}.md with recommended next moves per domain.",
      "skill": "analyze",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
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
      "category": "Planning",
      "title": "Weekly technical competitor pulse across 3 rivals",
      "blurb": "Blog + GitHub + changelog + API diffs.",
      "prompt": "Weekly technical pulse across {A}, {B}, {C} \u2014 what did they ship?",
      "fullPrompt": "Give me this week's technical competitor pulse across {Competitor A}, {Competitor B}, {Competitor C}. Use the analyze skill with subject=competitors. Scan each competitor's engineering blog, GitHub org activity (releases, major commits, star velocity), public changelog, and API diffs via Firecrawl + Exa. Label each signal technical-threat / parity-move / ignore. Save to competitor-watch/weekly-{YYYY-MM-DD}.md. If I name just one competitor instead of three, switch to teardown mode.",
      "description": "I scan each competitor's engineering blog, GitHub org activity, public changelog, and API diffs via Firecrawl and web search. Single-competitor teardown or N-competitor weekly digest, filtered for real threats vs noise.",
      "outcome": "A digest at competitor-watch/weekly-{YYYY-MM-DD}.md \u2014 moves to respond to + ignore list.",
      "skill": "analyze",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
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
      "category": "Triage",
      "title": "Turn this raw bug report into a structured ticket",
      "blurb": "Repro, severity, route, paste-ready description.",
      "prompt": "Triage this bug report \u2014 is this P0?",
      "fullPrompt": "Triage this bug report. Use the triage-bug-report skill. I'll paste the raw Sentry alert / user email / error text. Produce reproduction steps (where inferable), severity tied to my severity rules, route (hotfix / current sprint / backlog / close-as-not-a-bug / needs-more-info), and a paste-ready issue description for Linear / Jira / GitHub Issues. Save to bug-triage/{slug}.md.",
      "description": "I take a raw bug report (Sentry alert, user email, Slack message, error text) and produce repro steps, severity from your rules, route, and a paste-ready description for Linear / Jira / GitHub Issues. Never files.",
      "outcome": "A structured ticket draft at bug-triage/{slug}.md \u2014 paste into your tracker.",
      "skill": "triage-bug-report",
      "tools": {
        "analytics": [
          "sentry"
        ],
        "dev": [
          "linear",
          "jira",
          "github"
        ]
      }
    },
    {
      "category": "Triage",
      "title": "Triage this inbound feature request",
      "blurb": "Roadmap change, ticket, design doc, or skip.",
      "prompt": "A user filed this request \u2014 where should it go?",
      "fullPrompt": "Triage this inbound feature request. Use the triage-inbound-request skill. I'll paste the raw request (user email, sales call note, shower thought). Classify it: roadmap-change (route to plan-roadmap), ticket (route to triage-bug-report or a backlog entry), design-doc (route to draft-design-doc), or skip (with reasoning). Include the exact copy-paste prompt for the skill that owns it next. Save to inbound-triage/{slug}.md.",
      "description": "I classify feature requests / sales-call notes / shower thoughts as roadmap-change / ticket / design-doc / skip with reasoning, and write the exact paste-ready prompt for the skill that owns it next.",
      "outcome": "A verdict at inbound-triage/{slug}.md with a paste-ready follow-up prompt.",
      "skill": "triage-inbound-request"
    },
    {
      "category": "Triage",
      "title": "Groom the backlog \u2014 prune, merge, prioritize",
      "blurb": "Three lists: keep / merge / close. I never close.",
      "prompt": "Groom the backlog in Linear \u2014 what's stale?",
      "fullPrompt": "Groom the backlog. Use the groom-backlog skill. Pull all open tickets from the connected Linear / Jira / GitHub Issues. Return three review lists: keep-and-prioritize, merge-as-duplicates, close-as-stale \u2014 each with a one-line rationale per ticket. Save to backlog-grooming/{YYYY-MM-DD}.md. I never close, merge, or reprioritize in the tracker \u2014 you review and act.",
      "description": "I pull open tickets from Linear / Jira / GitHub Issues and return three review lists \u2014 keep, merge, close \u2014 each with one-line rationales. Never touches the tracker.",
      "outcome": "Lists at backlog-grooming/{YYYY-MM-DD}.md. Review and act in your tracker.",
      "skill": "groom-backlog",
      "tools": {
        "dev": [
          "linear",
          "jira",
          "github"
        ]
      }
    },
    {
      "category": "Triage",
      "title": "Score this ticket \u2014 RICE or MoSCoW",
      "blurb": "Per-axis reasoning. Final ranking.",
      "prompt": "RICE this ticket.",
      "fullPrompt": "Score {ticket or list}. Use the score-ticket-priority skill. Apply RICE (Reach \u00d7 Impact \u00d7 Confidence / Effort) or MoSCoW (Must / Should / Could / Won't) with one-line reasoning per axis and a final ranking. Save to priority-scores/{slug}.md.",
      "description": "I apply RICE or MoSCoW to a single ticket or a list, with per-axis reasoning grounded in priorities from the engineering context, and a final ranking.",
      "outcome": "A scoring table at priority-scores/{slug}.md ready to justify the call.",
      "skill": "score-ticket-priority",
      "tools": {
        "dev": [
          "linear",
          "jira",
          "github"
        ]
      }
    },
    {
      "category": "Triage",
      "title": "Rank tech debt by impact \u00d7 effort",
      "blurb": "One living list. Read-merge-write, never overwrite.",
      "prompt": "What's rotting? Rank the tech debt.",
      "fullPrompt": "Refresh the tech-debt inventory. Use the triage-tech-debt skill. Read context/engineering-context.md so impact scoring respects the actual stack and priorities. Read existing tech-debt.md at the agent root if it exists \u2014 merge new findings in, never wholesale-overwrite. Each entry: area, problem, impact (1-5), effort (S/M/L/XL), suggested next step. Sort by impact / effort. End with the top 3 to attack next week.",
      "description": "I maintain a single running tech-debt.md at the agent root: area, problem, impact (1-5), effort (S/M/L/XL), suggested next step per entry. Read-merge-write, never overwrite.",
      "outcome": "A sorted tech-debt.md with the top 3 debts to attack next week called out in chat.",
      "skill": "triage-tech-debt",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ]
      }
    },
    {
      "category": "Triage",
      "title": "Draft today's standup from my commits + PRs",
      "blurb": "Yesterday / Today / Blockers \u2014 copy-paste.",
      "prompt": "Draft my standup for today.",
      "fullPrompt": "Draft today's standup. Use the run-standup skill. Pull recent commits + PR activity from my connected GitHub / GitLab, recently closed tickets from Linear / Jira, mix in any notes I drop. Produce three bullets: Yesterday / Today / Blockers. Save to standups/{YYYY-MM-DD}.md. I never post to Slack \u2014 you copy-paste.",
      "description": "I pull your recent commits + PRs from GitHub / GitLab and closed tickets from Linear / Jira, then draft a three-bullet Yesterday / Today / Blockers. Never posts to Slack.",
      "outcome": "A draft at standups/{YYYY-MM-DD}.md. Copy-paste into Slack when ready.",
      "skill": "run-standup",
      "tools": {
        "dev": [
          "github",
          "gitlab",
          "linear",
          "jira"
        ],
        "messaging": [
          "slack"
        ]
      }
    },
    {
      "category": "Development",
      "title": "Review this PR \u2014 risks, suggestions, merge verdict",
      "blurb": "Security > correctness > perf > style. Inline suggestions.",
      "prompt": "Review PR {url} \u2014 risks, suggestions, merge verdict.",
      "fullPrompt": "Review PR {url}. Use the review-pr skill. Pull the diff, tests, description, and linked issue from my connected GitHub / GitLab / Bitbucket. Read context/engineering-context.md for the quality bar and sensitive areas. Order risks: security > correctness > performance > style. Suggest inline changes by file:line. End with a verdict (merge / merge-with-changes / hold). Save to pr-reviews/{pr-slug}.md. Do NOT post to the PR \u2014 I'll paste if I want.",
      "description": "I pull the diff + tests + description from GitHub / GitLab / Bitbucket, ground against the engineering context + sensitive areas, and write risks ranked security > correctness > perf > style with inline file:line suggestions and a merge verdict.",
      "outcome": "A review at pr-reviews/{pr-slug}.md I can skim in 60 seconds and paste if I want.",
      "skill": "review-pr",
      "tools": {
        "dev": [
          "github",
          "gitlab",
          "linear",
          "jira"
        ]
      }
    },
    {
      "category": "Development",
      "title": "Draft a design doc for {feature}",
      "blurb": "Context, goals, alternatives, risks \u2014 one skimmable doc.",
      "prompt": "Draft a design doc for {feature}.",
      "fullPrompt": "Draft a design doc for {feature}. Use the draft-design-doc skill. Read context/engineering-context.md so the design fits the stack + priorities. Sections: Context, Goals, Non-goals, Proposed design, Alternatives considered, Risks, Open questions. Name at least two real alternatives \u2014 not strawmen. Flag anything overlapping sensitiveAreas in the ledger. Save to design-docs/{feature-slug}.md. Where you had to assume, mark the assumption and ask me.",
      "description": "A full design doc from a one-line feature brief \u2014 Context, Goals, Non-goals, Proposed design, Alternatives considered, Risks, Open questions. At least two real alternatives, not strawmen.",
      "outcome": "A design doc at design-docs/{feature-slug}.md ready to circulate for async review.",
      "skill": "draft-design-doc",
      "tools": {
        "dev": [
          "github"
        ],
        "search": [
          "exa",
          "perplexityai"
        ]
      }
    },
    {
      "category": "Development",
      "title": "Write an ADR for {decision}",
      "blurb": "Michael Nygard template \u2014 preserve the why.",
      "prompt": "Write an ADR for {decision}.",
      "fullPrompt": "Write an Architecture Decision Record (ADR) for {decision}. Use the write-adr skill. Follow the Michael Nygard template: Title, Status (Proposed / Accepted / Deprecated / Superseded), Context, Decision, Consequences. Read context/engineering-context.md for stack. Keep it tight \u2014 one page, no padding. Save to adrs/{YYYY-MM-DD}-{slug}.md.",
      "description": "A Michael Nygard-style ADR so future-you (or a new hire) understands why the decision was made, not just what it was.",
      "outcome": "An ADR at adrs/{YYYY-MM-DD}-{slug}.md that preserves the decision's context forever.",
      "skill": "write-adr"
    },
    {
      "category": "Development",
      "title": "Audit the architecture of {system} for scale / maintainability",
      "blurb": "Risk-sorted concerns with current state + fix + effort.",
      "prompt": "Audit the architecture of {system}.",
      "fullPrompt": "Audit the architecture of {system}. Use the audit skill with surface=architecture. Read context/engineering-context.md for stack, invariants, and priorities. Walk modules / services / boundaries and produce a risk-sorted list (high / medium / low). For each concern: current state, proposed fix, effort (S/M/L/XL). Flag anything overlapping sensitiveAreas as high by default. Save to audits/architecture-{system-slug}-{YYYY-MM-DD}.md. Favor incremental fixes over rewrites.",
      "description": "I walk a system / module / service end-to-end and produce a risk-sorted list (high/medium/low) with current state, proposed fix, effort (S/M/L/XL) per item. Favors incremental fixes over rewrites.",
      "outcome": "An audit at audits/architecture-{system}-{date}.md \u2014 a ranked backlog of fixes, not a rewrite proposal.",
      "skill": "audit",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "analytics": [
          "sentry",
          "posthog"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Development",
      "title": "Audit CI/CD \u2014 flakies, slow jobs, missing gates",
      "blurb": "Impact \u00d7 effort fix list, not a warnings dump.",
      "prompt": "Audit my CI/CD pipeline.",
      "fullPrompt": "Audit my CI/CD. Use the audit skill with surface=ci-cd. Pull workflow config + last 100 runs from my connected GitHub / GitLab. Identify flaky tests (same-SHA retry-pass), rank slowest jobs by minutes-per-week, enumerate missing gates vs the quality bar in context/engineering-context.md, flag security gaps (plaintext secrets, unpinned actions, pull_request_target leaks). Save to audits/ci-cd-{repo}-{YYYY-MM-DD}.md with a prioritized fix list ranked by founder-impact.",
      "description": "I read workflow config + recent run history via GitHub or GitLab. Flakies ranked by rate \u00d7 frequency, slowest jobs by minutes-per-week, missing gates vs your quality bar, security gaps. Prioritized fix list, not a warnings dump.",
      "outcome": "An audit at audits/ci-cd-{repo}-{date}.md with a ranked fix list.",
      "skill": "audit",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "analytics": [
          "sentry",
          "posthog"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Development",
      "title": "Audit DX \u2014 setup time, build time, paper cuts",
      "blurb": "Top 5 paper cuts with suggested fixes.",
      "prompt": "Audit our dev setup \u2014 what's annoying new engineers?",
      "fullPrompt": "Audit our local dev experience. Use the audit skill with surface=devx. Read README + CONTRIBUTING + Makefile + package.json scripts + docker-compose + .env.example + CI config via the connected code host. Count discrete setup steps, estimate setup time, estimate build time from CI history, and surface the top 5 paper cuts (missing env vars, flaky scripts, bad error messages, outdated commands) with suggested fixes + effort. Save to audits/devx-{repo}-{YYYY-MM-DD}.md.",
      "description": "I read your README, CONTRIBUTING, Makefile, package.json scripts, docker-compose, .env.example and CI config. Estimate setup time, build time from CI history, and surface the top 5 paper cuts with suggested fixes.",
      "outcome": "An audit at audits/devx-{repo}-{date}.md \u2014 the 5 things to fix this week to stop annoying new engineers.",
      "skill": "audit",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "analytics": [
          "sentry",
          "posthog"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Development",
      "title": "Weekly PR health \u2014 cycle time, size, reviewer load",
      "blurb": "DORA-lite readout \u2014 5 metrics + one-line diagnoses.",
      "prompt": "Give me this week's PR health readout.",
      "fullPrompt": "Run the weekly PR health readout. Use the analyze skill with subject=pr-velocity. Pull the last 7 days of PRs from my connected GitHub / GitLab. Compute: PRs merged, median cycle time (open \u2192 merge), largest PR size in lines changed, reviewer concentration (top-reviewer share), open-to-merge age of currently-open PRs. Read context/engineering-context.md so the diagnosis respects quality bar + cadence. Save to pr-velocity/{YYYY-Www}.md with a one-line diagnosis per anomaly.",
      "description": "Five metrics from the last 7 days: PRs merged, median cycle time, largest PR size, reviewer concentration, open-to-merge age. One-line diagnosis per anomaly.",
      "outcome": "A one-pager at pr-velocity/{YYYY-Www}.md with the five metrics + one-line diagnoses.",
      "skill": "analyze",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
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
      "category": "Reliability",
      "title": "Coach me through this live incident",
      "blurb": "Stabilize \u2192 communicate \u2192 mitigate \u2192 verify \u2192 document.",
      "prompt": "An incident just fired \u2014 coach me through it.",
      "fullPrompt": "An incident just fired \u2014 run me through it. Use the run-incident-response skill. LIVE COACH + SCRIBE mode. Walk me through stabilize \u2192 communicate \u2192 mitigate \u2192 verify \u2192 document. Capture the incident timeline to incidents/{id}.md as we go. Never auto-rollback, never run prod commands \u2014 produce the next action, I execute it.",
      "description": "LIVE COACH + SCRIBE. I walk you through stabilize \u2192 communicate \u2192 mitigate \u2192 verify \u2192 document, capturing the timeline to incidents/{id}.md. Never auto-rollbacks, never runs prod commands.",
      "outcome": "A live incident doc at incidents/{id}.md that becomes the postmortem seed.",
      "skill": "run-incident-response",
      "tools": {
        "analytics": [
          "sentry",
          "posthog"
        ],
        "messaging": [
          "slack"
        ]
      }
    },
    {
      "category": "Reliability",
      "title": "Draft a blameless postmortem for {incident}",
      "blurb": "Summary, Impact, Timeline, Root cause, Action items.",
      "prompt": "Write the postmortem for {incident}.",
      "fullPrompt": "Write the postmortem for {incident}. Use the write-postmortem skill. Read the incident timeline at incidents/{id}.md and pull linked logs from my connected Sentry / PostHog / Datadog. Draft sections: Summary, Impact, Timeline, Root cause, Contributing factors, What went well, What went poorly, Action items (each with owner + due date). Save to postmortems/{id}.md.",
      "description": "I read the incident timeline + linked logs from Sentry, PostHog, or Datadog and draft a blameless postmortem with Summary, Impact, Timeline, Root cause, Contributing factors, What went well, What went poorly, and Action items.",
      "outcome": "A postmortem at postmortems/{id}.md ready to share with the team.",
      "skill": "write-postmortem",
      "tools": {
        "analytics": [
          "sentry",
          "posthog"
        ],
        "dev": [
          "linear",
          "jira"
        ]
      }
    },
    {
      "category": "Reliability",
      "title": "GO or NO-GO on this deploy",
      "blurb": "Tests, migrations, flags, rollback, on-call, runbook.",
      "prompt": "Is {release} ready to deploy?",
      "fullPrompt": "Is {release} ready to deploy? Use the review-deploy-readiness skill. Run the pre-deploy gate checklist: tests green, migrations backwards-compat, feature flags documented, rollback plan, on-call aware, runbook updated. Green / yellow / red per gate. Final verdict: GO / NO-GO / SOFT-GO with the condition. Save to deploy-readiness/{release-slug}.md. I never deploy \u2014 you click the button.",
      "description": "Pre-deploy gate checklist (tests, migrations, flags, rollback, on-call, runbook). Green / yellow / red per gate and a final GO / NO-GO / SOFT-GO verdict with the condition spelled out.",
      "outcome": "A verdict at deploy-readiness/{release}.md \u2014 decide whether to click deploy.",
      "skill": "review-deploy-readiness",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "analytics": [
          "sentry"
        ]
      }
    },
    {
      "category": "Reliability",
      "title": "Audit observability \u2014 what are we blind to?",
      "blurb": "3-column matrix + top 5 fixes by blast radius.",
      "prompt": "Audit my observability stack.",
      "fullPrompt": "Audit my observability. Use the audit skill with surface=observability. Read the connected Sentry / PostHog / Datadog / New Relic / Honeycomb. Produce a 3-column matrix (signal \u00d7 coverage \u00d7 gap) across errors / traces / logs / alerts / SLOs. Ground coverage expectations against context/engineering-context.md architecture + invariants. Top 5 fixes ranked by blast-radius reduction. Save to audits/observability-{YYYY-MM-DD}.md.",
      "description": "I review your connected Sentry / PostHog / Datadog / New Relic / Honeycomb and produce a 3-column matrix (signal \u00d7 coverage \u00d7 gap) across errors / traces / logs / alerts / SLOs, plus a top-5 fix list ranked by blast-radius reduction.",
      "outcome": "An audit at audits/observability-{date}.md with the blind spots called out.",
      "skill": "audit",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "analytics": [
          "sentry",
          "posthog"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Reliability",
      "title": "Draft a runbook for {system}",
      "blurb": "Commands, dashboards, rollback, if-this-fails branches.",
      "prompt": "Draft a runbook for {system}.",
      "fullPrompt": "Draft a runbook for {system}. Use the draft-runbook skill. Command-first ops doc with bash snippets + placeholders, dashboard URLs (from my connected Sentry / Datadog), rollback commands, and if-this-fails decision branches. No prose walls \u2014 every section is a command block or decision branch. Save to runbooks/{slug}.md.",
      "description": "I produce a command-first ops doc with bash snippets + placeholders, dashboard URLs, rollback commands, and if-this-fails decision branches. No prose walls.",
      "outcome": "A runbook at runbooks/{slug}.md \u2014 pasteable during an incident.",
      "skill": "draft-runbook",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "analytics": [
          "sentry"
        ]
      }
    },
    {
      "category": "Reliability",
      "title": "Monday engineering review (reliability-focused)",
      "blurb": "Shipped incidents, open postmortems, stale runbooks.",
      "prompt": "What shipped in reliability last week?",
      "fullPrompt": "Give me the weekly engineering review, focused on reliability. Use the analyze skill with subject=engineering-health. Aggregate incidents, postmortems, runbooks, deploy-readiness verdicts, and observability audits from the last 7 days. Call out any incident without a postmortem, any runbook that's stale vs the current architecture, any deploy-readiness SOFT-GO that needs follow-up. Save to reviews/{YYYY-MM-DD}.md.",
      "description": "I aggregate incidents, postmortems, runbooks, deploy-readiness verdicts, and observability audits from outputs.json and flag what needs follow-up this week.",
      "outcome": "Review at reviews/{YYYY-MM-DD}.md with the reliability gaps called out.",
      "skill": "analyze",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
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
      "category": "Docs",
      "title": "Audit my README \u2014 what's missing?",
      "blurb": "Checklist score + rewritten lede + prioritized fixes.",
      "prompt": "Audit my README.",
      "fullPrompt": "Audit my repo's README. Use the audit skill with surface=readme. Fetch README from my connected GitHub / GitLab (or accept a paste). Score against: one-sentence pitch, badges, quickstart, install, usage, configuration, contribution, license. Write an audit with inline diff suggestions, a rewritten lede, and a prioritized fix list. Save to audits/readme-{repo}-{YYYY-MM-DD}.md. Draft only \u2014 I never auto-commit.",
      "description": "I fetch your repo's README, score against a standard checklist, write inline diff suggestions + a rewritten lede, and produce a prioritized fix list. Never auto-commits.",
      "outcome": "An audit at audits/readme-{repo}-{date}.md with a rewritten lede and inline diffs.",
      "skill": "audit",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "analytics": [
          "sentry",
          "posthog"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Docs",
      "title": "Draft human API docs for {endpoint}",
      "blurb": "Stripe-grade per-endpoint doc from your OpenAPI spec.",
      "prompt": "Draft API docs for {endpoint}.",
      "fullPrompt": "Draft human API docs for {endpoint}. Use the write-docs skill with type=api. Read my OpenAPI spec (openapi.yaml / swagger.json) from the connected GitHub / GitLab, or accept a paste of a representative request/response. Per-endpoint doc with purpose, params table, request body, response body, error codes, curl example, SDK snippet. Save to api-docs/{endpoint-slug}.md. Never invents behavior the spec doesn't describe.",
      "description": "I read your OpenAPI spec from GitHub or GitLab (or accept a paste) and write Stripe-grade per-endpoint docs: purpose, params table, request body, response body, error codes, curl example, SDK snippet. Never invents behavior.",
      "outcome": "A per-endpoint doc at api-docs/{endpoint-slug}.md ready for your docs site.",
      "skill": "write-docs",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "search": [
          "exa",
          "perplexityai"
        ]
      }
    },
    {
      "category": "Docs",
      "title": "Write the new-engineer onboarding guide",
      "blurb": "First day / First week / First month. Verified steps.",
      "prompt": "Write the new-engineer onboarding guide.",
      "fullPrompt": "Write (or update) the new-engineer onboarding guide. Use the write-docs skill with type=onboarding-guide. Read context/engineering-context.md + the repo structure (README, CONTRIBUTING, Makefile, package.json scripts, docker-compose, .env.example, CI config) via my connected GitHub / GitLab. Maintain a single running onboarding-guide.md at the agent root: First day (clone, setup, first successful local run), First week (repo map, conventions, how PRs work here, sensitive areas), First month (owned systems, FAQ). Verify every setup step against the actual Makefile / scripts. Draft only \u2014 I never auto-commit.",
      "description": "I maintain a single running onboarding-guide.md at the agent root with First day / First week / First month, verified setup steps, conventions, sensitive areas, FAQ. Read-merge-update, never wholesale-overwrite.",
      "outcome": "A living onboarding-guide.md at the agent root. Send to the next hire's day one.",
      "skill": "write-docs",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "search": [
          "exa",
          "perplexityai"
        ]
      }
    },
    {
      "category": "Docs",
      "title": "Write a tutorial for {feature}",
      "blurb": "Di\u00e1taxis-aligned \u2014 concrete end-to-end, working code.",
      "prompt": "Write a how-to for {feature}.",
      "fullPrompt": "Write a tutorial for {feature}. Use the write-docs skill with type=tutorial. Di\u00e1taxis-aligned (learning-oriented, concrete end-to-end flow the reader runs). Sections: Overview, Prerequisites, Numbered steps with working code blocks, Verify, Troubleshooting (2-4 common errors), Next steps. Every code block must run. Save to tutorials/{slug}.md. Draft only \u2014 I never publish.",
      "description": "A Di\u00e1taxis-aligned tutorial (learning-oriented) with Overview, Prerequisites, numbered steps with working code, Verify commands, Troubleshooting, and Next steps. Every code block runs.",
      "outcome": "A tutorial at tutorials/{slug}.md ready for your docs site.",
      "skill": "write-docs",
      "tools": {
        "dev": [
          "github",
          "gitlab"
        ],
        "search": [
          "exa",
          "perplexityai"
        ]
      }
    },
    {
      "category": "Docs",
      "title": "Draft public release notes since {tag}",
      "blurb": "Headline, highlights, breaking changes, upgrade notes.",
      "prompt": "Draft public release notes for {version}.",
      "fullPrompt": "Draft public release notes for {version} (since {prior tag}). Use the write-release-notes skill with format=release-notes. Pull merged PRs + linked issues via my connected GitHub / GitLab + Linear / Jira. Filter for user-visible changes. Write a narrative post: headline, 3-5 highlights (user outcomes, not 'upgraded queue worker'), breaking changes with migration snippets, upgrade notes, fixed list, thanks if contributors. Save to release-notes/{version}.md.",
      "description": "I pull merged PRs + linked issues from GitHub / GitLab + Linear / Jira since your prior tag, filter for user-visible changes, and draft a public-facing narrative release post with headline, highlights, breaking changes (with migration snippets), and upgrade notes.",
      "outcome": "A release post at release-notes/{version}.md ready to publish.",
      "skill": "write-release-notes",
      "tools": {
        "dev": [
          "github",
          "gitlab",
          "linear",
          "jira"
        ]
      }
    },
    {
      "category": "Docs",
      "title": "Update CHANGELOG from PRs since {version}",
      "blurb": "Keep-A-Changelog snippet you paste into CHANGELOG.md.",
      "prompt": "Update CHANGELOG from PRs since {version}.",
      "fullPrompt": "Update the CHANGELOG. Use the write-release-notes skill with format=changelog. Pull merged PRs + linked issues via my connected GitHub / GitLab since {version}. Filter for user-facing changes. Produce a Keep-A-Changelog snippet sectioned Added / Changed / Deprecated / Removed / Fixed / Security \u2014 one line per change in user-facing language. Save to changelog/{version}.md as a snippet I paste into the canonical CHANGELOG.md. Never writes to CHANGELOG.md directly.",
      "description": "I pull merged PRs from GitHub or GitLab since the version you name, filter for user-visible changes, and produce a Keep-A-Changelog snippet (Added / Changed / Deprecated / Removed / Fixed / Security). Never writes the canonical CHANGELOG.md \u2014 you paste the snippet.",
      "outcome": "A changelog snippet at changelog/{version}.md. Copy into your canonical CHANGELOG.md.",
      "skill": "write-release-notes",
      "tools": {
        "dev": [
          "github",
          "gitlab",
          "linear",
          "jira"
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
      // Eyebrow: category (· tool · tool · …)
      (function () {
        var names = flattenTools(uc.tools);
        var parts = [h("span", { key: "cat" }, uc.category || "Mission")];
        for (var i = 0; i < names.length; i++) {
          parts.push(h("span", { key: "s" + i, className: "hv-eyebrow-sep" }, "·"));
          parts.push(h("span", { key: "n" + i }, names[i]));
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
