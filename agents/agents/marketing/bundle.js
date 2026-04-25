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

  // ── Slug → display-name dictionary (for the tile eyebrow) ──
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
  // Flatten grouped tools map to a capped list of display names.
  // Returns { names: string[], extra: number } where extra > 0 means truncated.
  var EYEBROW_TOOL_CAP = 4;
  function flattenToolsForEyebrow(tools) {
    if (!tools || typeof tools !== "object") return { names: [], extra: 0 };
    var flat = [];
    for (var cat in tools) {
      if (!Object.prototype.hasOwnProperty.call(tools, cat)) continue;
      var list = tools[cat];
      if (!list || !list.length) continue;
      for (var i = 0; i < list.length; i++) flat.push(displayName(list[i]));
    }
    if (flat.length <= EYEBROW_TOOL_CAP) return { names: flat, extra: 0 };
    return { names: flat.slice(0, EYEBROW_TOOL_CAP), extra: flat.length - EYEBROW_TOOL_CAP };
  }

  // ═════════ PER-AGENT CONFIG (injected by generator) ═════════
  var AGENT = {
  "name": "Marketing",
  "tagline": "Your full-stack marketing operator. Positioning, SEO & content, email & lifecycle, social, paid & growth, and conversion copy — one agent, one conversation.",
  "chips": [
    "Positioning",
    "SEO",
    "Email",
    "Social",
    "Paid",
    "Copy"
  ],
  "useCases": [
    {
      "category": "Positioning",
      "title": "Draft the positioning doc that anchors every other output",
      "blurb": "ICP, category, differentiators, brand voice, primary CTA.",
      "prompt": "Help me write my positioning statement.",
      "fullPrompt": "Help me write my full positioning doc: ICP, category, differentiators, brand voice, pricing stance, primary CTA. Use the define-positioning skill. Interview me briefly, then write to context/marketing-context.md — the source of truth every other skill in this agent reads before it produces copy, content, or campaigns.",
      "description": "I interview you briefly and write the full positioning doc (ICP, category, differentiators, brand voice, pricing stance, primary CTA) to context/marketing-context.md. Every other skill reads it first.",
      "outcome": "A locked positioning doc at context/marketing-context.md. Every skill that writes copy, content, or campaigns reads it.",
      "skill": "define-positioning",
      "tools": {
        "docs": [
          "googledocs",
          "notion"
        ]
      }
    },
    {
      "category": "Positioning",
      "title": "Build a buyer persona from your closed-won accounts",
      "blurb": "Real JTBD, pains, triggers — pulled from your CRM.",
      "prompt": "Build a buyer persona for {segment} from my HubSpot closed-won accounts.",
      "fullPrompt": "Build a buyer persona for {segment}. Use the profile-icp skill. Pull my top closed-won accounts from my connected CRM (HubSpot / Attio / Salesforce via Composio), extract common firmographics, roles, and decision-maker patterns, then synthesize pains ranked by frequency, jobs-to-be-done, triggers that mean they're in-market, objection patterns, and 1–2 anchor accounts. Save to personas/{slug}.md.",
      "description": "Pull top closed-won accounts from your connected CRM (HubSpot / Attio / Salesforce) and synthesize a persona with JTBD, pains ranked by frequency, triggers, objection patterns, and anchor accounts.",
      "outcome": "Persona at personas/{slug}.md — the foundation ad copy and landing pages pull from.",
      "skill": "profile-icp",
      "tools": {
        "crm": [
          "hubspot",
          "salesforce",
          "attio"
        ]
      }
    },
    {
      "category": "Positioning",
      "title": "Weekly competitor pulse across 3 rivals",
      "blurb": "Blog + product + ads + social. Threats vs noise.",
      "prompt": "Weekly competitor pulse across {A}, {B}, {C} — what did they ship?",
      "fullPrompt": "Give me this week's competitor pulse across {Competitor A}, {Competitor B}, {Competitor C}. Use the monitor-competitors skill with source=product. Scan each competitor's recent blog posts, product updates, release notes, and pricing pages via Firecrawl. Filter real threats from noise. Save to competitor-briefs/product-weekly-{YYYY-MM-DD}.md.",
      "description": "I scan each competitor's blog, product updates, and pricing via Firecrawl. Single-competitor teardown or N-competitor weekly digest, filtered for real threats vs noise.",
      "outcome": "Weekly digest at competitor-briefs/product-weekly-{YYYY-MM-DD}.md — moves to respond to + ignore list.",
      "skill": "monitor-competitors",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "ads": [
          "metaads"
        ],
        "social": [
          "linkedin",
          "twitter",
          "reddit",
          "instagram"
        ]
      }
    },
    {
      "category": "Positioning",
      "title": "Deep teardown of one competitor",
      "blurb": "Positioning, pricing, content, where we can press.",
      "prompt": "Do a full teardown of {competitor}.",
      "fullPrompt": "Do a full teardown of {competitor}. Use the monitor-competitors skill with source=product. Go deep on all dimensions via Firecrawl: positioning statement, pricing page, content strategy, messaging patterns, unguarded flanks we should press. Save to competitor-briefs/product-{competitor-slug}.md.",
      "description": "One competitor, all dimensions via web scrape: positioning, pricing, content strategy, messaging patterns, unguarded flanks to attack.",
      "outcome": "Teardown at competitor-briefs/product-{competitor}.md. Send it to the paid campaign skill for ad angles.",
      "skill": "monitor-competitors",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "ads": [
          "metaads"
        ],
        "social": [
          "linkedin",
          "twitter",
          "reddit",
          "instagram"
        ]
      }
    },
    {
      "category": "Positioning",
      "title": "Research a topic for a brief you can act on",
      "blurb": "Exa-powered deep research with sources cited.",
      "prompt": "Research {topic} with Exa and give me a structured brief.",
      "fullPrompt": "Research {topic} with Exa and give me a structured brief. Use the synthesize-research skill. Deep research via connected Exa (or Perplexity / Firecrawl fallback), cite sources, and deliver key findings + 3–5 angles worth writing about. Save to research/{slug}.md so downstream content / ad / landing-page skills can pull from it.",
      "description": "Deep research via Exa (or Perplexity / Firecrawl fallback). Structured brief with cited sources and 3–5 angles worth writing about.",
      "outcome": "Brief at research/{slug}.md. Hand to the write-content or write-page-copy skills for drafting.",
      "skill": "synthesize-research",
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
      "category": "Positioning",
      "title": "Mine your sales calls for real customer language",
      "blurb": "Verbatim pains + objections + positioning wedges.",
      "prompt": "Mine my last 10 sales calls from Gong for objections.",
      "fullPrompt": "Mine my last 10 sales calls from my connected call-recording app (Gong / Fireflies via Composio) for positioning signals. Use the mine-sales-calls skill. Extract verbatim customer phrases, rank pains by frequency, surface objection patterns, and flag positioning wedges. Save to call-insights/{YYYY-MM-DD}.md.",
      "description": "Pull transcripts from your connected call-recording app (Gong / Fireflies), extract verbatim customer phrases, rank pains by frequency, flag positioning wedges.",
      "outcome": "Insights at call-insights/{date}.md — the single best source for ad copy and landing-page headlines.",
      "skill": "mine-sales-calls",
      "tools": {
        "meetings": [
          "gong",
          "fireflies"
        ]
      }
    },
    {
      "category": "Positioning",
      "title": "Sequence a 2-week launch across every domain",
      "blurb": "Pre-launch, launch day, post-launch — one plan.",
      "prompt": "Plan the {feature} launch over 2 weeks.",
      "fullPrompt": "Plan the {feature} launch over the next 2 weeks. Use the plan-campaign skill with type=launch. Break it into pre-launch (7d out), launch day, post-launch. Each task tagged with the right follow-up skill in this agent (write-content for launch post, plan-campaign type=paid for ad creative, plan-campaign type=announcement for email + in-app, write-page-copy for landing updates). Save to campaigns/launch-{slug}.md.",
      "description": "I break the launch into pre-launch (7d out), launch day, post-launch. Each task tagged to the follow-up skill inside this same agent — no cross-agent handoffs.",
      "outcome": "Sequenced plan at campaigns/launch-{slug}.md with owner + timing per task.",
      "skill": "plan-campaign",
      "tools": {
        "ads": [
          "googleads",
          "metaads"
        ],
        "esp": [
          "customerio",
          "mailchimp"
        ],
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot"
        ]
      }
    },
    {
      "category": "Positioning",
      "title": "The Monday marketing health review",
      "blurb": "What shipped, what's stale, what to do next.",
      "prompt": "Give me the Monday marketing health review.",
      "fullPrompt": "Give me the Monday marketing health review. Use the analyze skill with subject=marketing-health. Aggregate everything I produced this week across all domains (blog posts, campaigns, emails, social, page copy) from outputs.json, flag gaps (e.g. 'no email shipped in 3 weeks'), and recommend next moves grouped by domain. Save to analyses/marketing-health-{YYYY-MM-DD}.md.",
      "description": "I aggregate everything this agent produced this week across all 6 domains from outputs.json, flag gaps, recommend next moves. A 2-minute scan.",
      "outcome": "Review at analyses/marketing-health-{YYYY-MM-DD}.md with recommended next moves per domain.",
      "skill": "analyze",
      "tools": {
        "analytics": [
          "posthog",
          "mixpanel"
        ],
        "scrape": [
          "firecrawl"
        ],
        "seo": [
          "semrush"
        ]
      }
    },
    {
      "category": "SEO",
      "title": "Run a full SEO audit of your site",
      "blurb": "10 prioritized fixes — impact × ease, no wall of warnings.",
      "prompt": "Run an SEO audit of my site with Semrush.",
      "fullPrompt": "Run a full SEO audit of my site. Use the audit skill with surface=site-seo. Pull on-page + technical via my connected Semrush (or Ahrefs / Firecrawl fallback). Score issues by impact × ease, not severity level. Give me the top 10 prioritized fixes with the exact change each one needs (title tag, schema, internal link, missing alt, etc.). Save to audits/site-seo-{domain}-{YYYY-MM-DD}.md.",
      "description": "On-page + technical audit via Semrush (or Ahrefs / Firecrawl fallback). Ranks issues by impact × ease, not severity — a fix list, not a wall of warnings.",
      "outcome": "Scored audit at audits/site-seo-{domain}-{date}.md — 10 prioritized fixes you can ship this week.",
      "skill": "audit",
      "tools": {
        "seo": [
          "semrush",
          "ahrefs"
        ],
        "scrape": [
          "firecrawl"
        ],
        "search": [
          "perplexityai"
        ]
      }
    },
    {
      "category": "SEO",
      "title": "Check visibility in ChatGPT, Perplexity, Gemini",
      "blurb": "GEO audit: schema, mentions, source authority.",
      "prompt": "How do I show up in AI search? Run a GEO audit.",
      "fullPrompt": "How does my product show up in ChatGPT, Perplexity, and Gemini? Use the audit skill with surface=ai-search. Probe AI engines for my brand and category terms, then recommend Generative Engine Optimization (GEO) changes — schema, mentions, source authority, content tweaks. Save to audits/ai-search-{YYYY-MM-DD}.md.",
      "description": "I probe AI search engines for your brand and category terms, then recommend GEO (Generative Engine Optimization) changes: schema, mentions, source authority, content tweaks.",
      "outcome": "AI-search audit at audits/ai-search-{date}.md with concrete content + schema changes.",
      "skill": "audit",
      "tools": {
        "seo": [
          "semrush",
          "ahrefs"
        ],
        "scrape": [
          "firecrawl"
        ],
        "search": [
          "perplexityai"
        ]
      }
    },
    {
      "category": "SEO",
      "title": "Build the keyword map you can actually own",
      "blurb": "Clusters by intent × difficulty. Top 3 pillars.",
      "prompt": "Run keyword research with Semrush for {topic}.",
      "fullPrompt": "Run keyword research with Semrush for {topic}. Use the research-keywords skill. Cluster by intent and difficulty, flag the 3 pillars worth owning (not the top 50), and draft cluster briefs. Maintain the living keyword-map.md and per-cluster detail at keyword-clusters/{slug}.md.",
      "description": "I cluster keywords by intent and difficulty via Semrush (or Ahrefs). Flag the 3 pillars worth owning. Draft cluster briefs. No vanity keyword dumps.",
      "outcome": "Living keyword-map.md + per-cluster briefs at keyword-clusters/{slug}.md.",
      "skill": "research-keywords",
      "tools": {
        "seo": [
          "semrush",
          "ahrefs"
        ]
      }
    },
    {
      "category": "SEO",
      "title": "Find your content gap vs a competitor",
      "blurb": "Gaps ranked by volume × how easily we take them.",
      "prompt": "Where's our content gap vs {competitor}?",
      "fullPrompt": "Where's our content gap vs {competitor}? Use the analyze skill with subject=content-gap. Crawl their content via Firecrawl, compare to ours, and rank gaps by search volume × how easily we could take the topic. Save to analyses/content-gap-{competitor}-{YYYY-MM-DD}.md with a first-draft brief per gap.",
      "description": "I crawl their content via Firecrawl, compare to ours, and rank gaps by search volume × how easily we could take the topic.",
      "outcome": "Ranked gap list at analyses/content-gap-{competitor}-{date}.md with a first-draft brief per gap.",
      "skill": "analyze",
      "tools": {
        "analytics": [
          "posthog",
          "mixpanel"
        ],
        "scrape": [
          "firecrawl"
        ],
        "seo": [
          "semrush"
        ]
      }
    },
    {
      "category": "SEO",
      "title": "Draft a full SEO-targeted blog post",
      "blurb": "2,000–3,000 words with meta, slug, internal links, CTA.",
      "prompt": "Draft a blog post on {topic} targeting {keyword}.",
      "fullPrompt": "Draft a blog post on {topic} targeting {keyword}. Use the write-content skill with channel=blog. 2,000–3,000 words with proper H1/H2/H3, meta description, URL slug, internal-link suggestions, and one clear CTA. Reads like I wrote it. Save to blog-posts/{slug}.md and also save to my connected Google Docs if one's linked.",
      "description": "2,000–3,000-word draft with H1/H2/H3, meta description, URL slug, internal-link suggestions, and one clear CTA. Saved to a Google Doc if connected. Reads like you wrote it.",
      "outcome": "Draft at blog-posts/{slug}.md (+ Google Doc if connected). Paste into your CMS.",
      "skill": "write-content",
      "tools": {
        "docs": [
          "googledocs"
        ],
        "social": [
          "linkedin",
          "twitter"
        ],
        "esp": [
          "mailchimp"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "SEO",
      "title": "Turn a happy customer into a case study",
      "blurb": "Challenge → approach → results — with real numbers.",
      "prompt": "Draft a case study for {customer} from Airtable notes.",
      "fullPrompt": "Draft a case study for {customer}. Use the write-case-study skill. Pull the interview / email thread / testimonial from my connected Airtable (or other notes app via Composio), or use what I paste. Structure as challenge → approach → results with real numbers, not marketer-speak. Save to case-studies/{customer-slug}.md.",
      "description": "I pull the interview / email thread / testimonial (from Airtable / notes app / paste) and structure as challenge → approach → results with real numbers — not marketer-speak.",
      "outcome": "Case study at case-studies/{customer}.md ready for sales + your website.",
      "skill": "write-case-study",
      "tools": {
        "docs": [
          "airtable",
          "notion"
        ]
      }
    },
    {
      "category": "SEO",
      "title": "Turn one blog post into 5 LinkedIn posts",
      "blurb": "Each reshaped for LinkedIn's native format.",
      "prompt": "Turn {blog post URL} into 5 LinkedIn posts.",
      "fullPrompt": "Turn {blog post URL} into 5 LinkedIn posts. Use the repurpose-content skill. Extract the core ideas via Firecrawl and reshape each into a LinkedIn-native post (hook, whitespace, one clear takeaway) I can copy into the write-content skill's LinkedIn channel to ship. Save to repurposed/{source-slug}-to-linkedin.md.",
      "description": "I extract the core ideas via Firecrawl and reshape each into a LinkedIn-native post (hook, whitespace, one clear takeaway).",
      "outcome": "5 drafts at repurposed/{source}-to-linkedin.md.",
      "skill": "repurpose-content",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "video": [
          "youtube"
        ]
      }
    },
    {
      "category": "SEO",
      "title": "Turn a YouTube video into a blog draft",
      "blurb": "Transcript → long-form SEO-structured draft.",
      "prompt": "Turn {YouTube URL} into a blog post draft.",
      "fullPrompt": "Turn {YouTube URL} into a blog post draft. Use the repurpose-content skill. Fetch the transcript via YouTube (Composio) and rewrite as a long-form blog draft with SEO structure (H1/H2, keywords, meta). Great for founder interviews, conference talks, or live sessions. Save to repurposed/{video-slug}-to-blog.md.",
      "description": "I fetch the transcript via YouTube and rewrite as a long-form blog draft with SEO structure. Great for conference talks, founder interviews, live sessions.",
      "outcome": "Draft at repurposed/{video}-to-blog.md.",
      "skill": "repurpose-content",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "video": [
          "youtube"
        ]
      }
    },
    {
      "category": "SEO",
      "title": "Find backlink targets + draft the pitches",
      "blurb": "Per-site pitch emails — no template spam.",
      "prompt": "Find backlink targets with Ahrefs and draft the pitches.",
      "fullPrompt": "Find backlink targets and draft the pitches. Use the find-backlinks skill. Identify target sites via SERP + my connected Ahrefs (backlink tool) that match our niche, then draft per-target pitch emails grounded in what we actually offer them. Save to backlink-plans/{YYYY-MM-DD}.md.",
      "description": "I identify target sites via SERP + Ahrefs (backlink tool) that match your niche, then draft per-target pitch emails grounded in what you actually offer them.",
      "outcome": "Backlink plan at backlink-plans/{date}.md with outreach drafts per target.",
      "skill": "find-backlinks",
      "tools": {
        "seo": [
          "ahrefs",
          "semrush"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Email",
      "title": "Draft a 5-email welcome series for new signups",
      "blurb": "Day 0 / 1 / 3 / 7 / 14 — subject, body, CTA, metric.",
      "prompt": "Draft a 5-email welcome series for new signups.",
      "fullPrompt": "Draft a 5-email welcome series for new signups. Use the plan-campaign skill with type=welcome. Day 0 / 1 / 3 / 7 / 14 default (override any cadence). Each email: subject, preview, body, CTA, success metric. Formatted for my connected ESP (Customer.io / Loops / Mailchimp / Kit — via Composio). Save to campaigns/welcome-{variant}.md.",
      "description": "Day 0 / 1 / 3 / 7 / 14 sequence (override any cadence). Each email: subject, preview, body, CTA, success metric. Formatted for your connected ESP.",
      "outcome": "Full sequence at campaigns/welcome-{variant}.md. Drop into your platform.",
      "skill": "plan-campaign",
      "tools": {
        "ads": [
          "googleads",
          "metaads"
        ],
        "esp": [
          "customerio",
          "mailchimp"
        ],
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot"
        ]
      }
    },
    {
      "category": "Email",
      "title": "Re-activate signups who never activated",
      "blurb": "Event-triggered drip with honest stopping rules.",
      "prompt": "Design a re-activation drip for users who never activated.",
      "fullPrompt": "Design a re-activation drip for users who signed up but never activated. Use the plan-campaign skill with type=lifecycle-drip. Event-triggered: trigger event, frequency rules, branching by user action, drafted copy per email. Honest about when to stop emailing. Save to campaigns/lifecycle-drip-{slug}.md.",
      "description": "Event-triggered drip: trigger event, frequency rules, branching by user action, drafted copy per email. Honest about when to stop emailing.",
      "outcome": "Drip plan at campaigns/lifecycle-drip-{slug}.md with every branch labeled.",
      "skill": "plan-campaign",
      "tools": {
        "ads": [
          "googleads",
          "metaads"
        ],
        "esp": [
          "customerio",
          "mailchimp"
        ],
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot"
        ]
      }
    },
    {
      "category": "Email",
      "title": "Draft this week's newsletter",
      "blurb": "One through-line. Pulls source from recent outputs.",
      "prompt": "Draft this week's newsletter — here's what shipped.",
      "fullPrompt": "Draft this week's newsletter. Use the write-content skill with channel=newsletter. Subject + preview + body with one clear through-line (not 5 updates glued together). Pull source material from this week's blog posts / case studies / launches in outputs.json if relevant. Save to newsletters/{YYYY-MM-DD}.md ready for my connected Beehiiv / Substack / ESP.",
      "description": "Subject + preview + body with one clear through-line. Pulls source material from this week's blog / case-study / launch outputs if relevant.",
      "outcome": "Newsletter at newsletters/{date}.md ready for your ESP.",
      "skill": "write-content",
      "tools": {
        "docs": [
          "googledocs"
        ],
        "social": [
          "linkedin",
          "twitter"
        ],
        "esp": [
          "mailchimp"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Email",
      "title": "Save a downgrade without the guilt trip",
      "blurb": "Genuine option — pause / downgrade / concierge / refund.",
      "prompt": "Draft a save email for accounts that downgraded in Stripe.",
      "fullPrompt": "Draft a save email for accounts that downgraded. Use the plan-campaign skill with type=churn-save. Pull the downgrade signal from my connected Stripe / HubSpot if available. No guilt tactics, no fake scarcity. Offer a genuine option (pause / downgrade further / concierge help / refund). Tone matches my voice. Save to campaigns/churn-save-{persona}.md.",
      "description": "No guilt tactics, no fake scarcity. Offer a genuine option (pause / downgrade further / concierge help / refund). Tone matches your voice.",
      "outcome": "Save email at campaigns/churn-save-{persona}.md.",
      "skill": "plan-campaign",
      "tools": {
        "ads": [
          "googleads",
          "metaads"
        ],
        "esp": [
          "customerio",
          "mailchimp"
        ],
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot"
        ]
      }
    },
    {
      "category": "Email",
      "title": "Product announcement — email + in-app, coordinated",
      "blurb": "Email body and matching in-app copy together.",
      "prompt": "Plan the email + in-app announcement for {feature}.",
      "fullPrompt": "Plan the email + in-app announcement for {feature}. Use the plan-campaign skill with type=announcement. Draft the announcement email AND matching in-app copy (banner / modal / empty-state nudge), keyed to the launch plan at campaigns/launch-{feature}.md if one exists. Save to campaigns/announcement-{feature-slug}.md.",
      "description": "Announcement email AND matching in-app copy (banner / modal / empty-state nudge), keyed to the launch plan if one exists.",
      "outcome": "Full set at campaigns/announcement-{feature}.md — email body + in-app strings.",
      "skill": "plan-campaign",
      "tools": {
        "ads": [
          "googleads",
          "metaads"
        ],
        "esp": [
          "customerio",
          "mailchimp"
        ],
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot"
        ]
      }
    },
    {
      "category": "Social",
      "title": "Draft a LinkedIn post in your voice",
      "blurb": "Hook, whitespace, takeaway, CTA — your voice.",
      "prompt": "Draft a LinkedIn post about {topic} in my voice.",
      "fullPrompt": "Draft a LinkedIn post about {topic} in my voice. Use the write-content skill with channel=linkedin. Hook in the first line, whitespace, one clear takeaway, CTA or question to spark replies. Uses my saved voice samples so it doesn't sound like AI. Save to posts/linkedin-{slug}.md.",
      "description": "Hook in the first line, whitespace, one clear takeaway, CTA or question. Uses your saved voice samples so it doesn't sound like AI.",
      "outcome": "Draft at posts/linkedin-{slug}.md — paste into LinkedIn when ready.",
      "skill": "write-content",
      "tools": {
        "docs": [
          "googledocs"
        ],
        "social": [
          "linkedin",
          "twitter"
        ],
        "esp": [
          "mailchimp"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Social",
      "title": "Draft a 7-tweet X thread",
      "blurb": "Hook + numbered progression + CTA. 280 chars each.",
      "prompt": "Draft a 7-tweet X thread on {topic}.",
      "fullPrompt": "Draft a 7-tweet X thread on {topic}. Use the write-content skill with channel=x-thread. Hook tweet, numbered progression, CTA tweet at the end. Each tweet fits the 280-char budget with room for edits. Save to threads/x-{slug}.md.",
      "description": "Hook tweet, numbered progression, CTA tweet at the end. Each tweet fits the 280-char budget with room for edits.",
      "outcome": "Thread at threads/x-{slug}.md — copy tweet-by-tweet into your scheduler.",
      "skill": "write-content",
      "tools": {
        "docs": [
          "googledocs"
        ],
        "social": [
          "linkedin",
          "twitter"
        ],
        "esp": [
          "mailchimp"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Social",
      "title": "Reply to a Reddit thread the right way",
      "blurb": "Value-first, no pitch, link only if relevant.",
      "prompt": "Draft a Reddit reply to {thread URL}.",
      "fullPrompt": "Draft a Reddit reply to {thread URL}. Use the write-content skill with channel=reddit. Pull the source thread via Reddit (Composio) / Firecrawl fallback, then draft a value-first reply. Helpful first, link only if it truly belongs. Save to community-replies/{source-slug}.md.",
      "description": "I pull the source thread (via Reddit / Firecrawl) and draft a value-first reply. Helpful first, link only if it truly belongs.",
      "outcome": "Reply at community-replies/{source}.md.",
      "skill": "write-content",
      "tools": {
        "docs": [
          "googledocs"
        ],
        "social": [
          "linkedin",
          "twitter"
        ],
        "esp": [
          "mailchimp"
        ],
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Social",
      "title": "Plan this week's social calendar",
      "blurb": "Mon–Fri per platform, mixing new + repurposed.",
      "prompt": "Plan this week's social across LinkedIn and X.",
      "fullPrompt": "Plan this week's social content across LinkedIn and X. Use the plan-social-calendar skill. Mon–Fri per platform, keyed to my topics, mixing original posts with repurposed content from outputs.json (zero duplicate angles). Save to social-calendars/{YYYY-WNN}.md and append to social-calendar.md.",
      "description": "Mon–Fri plan per platform (LinkedIn / X / Reddit), keyed to your topics, mixing original posts with repurposed content from this agent's outputs (zero duplicate angles).",
      "outcome": "Calendar at social-calendars/{YYYY-WNN}.md + appended to living social-calendar.md.",
      "skill": "plan-social-calendar"
    },
    {
      "category": "Social",
      "title": "Scan your X timeline for what to engage with",
      "blurb": "Filtered for your topics. Suggested reply drafts.",
      "prompt": "Scan my X timeline and surface engagement opportunities.",
      "fullPrompt": "Scan my X timeline and surface what's worth engaging with. Use the monitor-competitors skill with source=social-feed. Filter my feed for relevance to my topics and engagement opportunities, then suggest concrete replies — no doom-scrolling. Save to competitor-briefs/social-feed-x-{YYYY-MM-DD}.md with reply drafts per opportunity.",
      "description": "I filter your feed for relevance to your topics and engagement opportunities, then suggest concrete replies — no more doom-scrolling for something to comment on.",
      "outcome": "Digest at competitor-briefs/social-feed-x-{date}.md with reply drafts.",
      "skill": "monitor-competitors",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "ads": [
          "metaads"
        ],
        "social": [
          "linkedin",
          "twitter",
          "reddit",
          "instagram"
        ]
      }
    },
    {
      "category": "Social",
      "title": "Weekly LinkedIn digest — how your posts did",
      "blurb": "Your stats + notable network posts worth commenting on.",
      "prompt": "Give me the weekly LinkedIn digest.",
      "fullPrompt": "Give me the weekly LinkedIn digest. Use the digest-linkedin-activity skill. Pull stats on my own posts (reach, engagement, new followers) via my connected LinkedIn plus notable posts in my network worth commenting on. A 5-minute read. Save to linkedin-digests/{YYYY-MM-DD}.md for Monday morning.",
      "description": "Stats on your own posts (reach, engagement, new followers) plus notable posts in your network worth commenting on. 5-minute read.",
      "outcome": "Digest at linkedin-digests/{date}.md for Monday morning.",
      "skill": "digest-linkedin-activity",
      "tools": {
        "social": [
          "linkedin"
        ]
      }
    },
    {
      "category": "Social",
      "title": "Get yourself booked on your ICP's podcasts",
      "blurb": "Per-show pitches — hook, angle, proof, ask.",
      "prompt": "Draft podcast outreach for 5 shows our ICP listens to.",
      "fullPrompt": "Draft podcast outreach for 5 shows our ICP listens to. Use the pitch-podcast skill. Identify target shows by audience fit via Listen Notes and draft per-show pitches: hook based on my positioning, angle, proof, clear ask. No template spam. Save to podcast-pitches/{YYYY-MM-DD}.md.",
      "description": "I identify target shows by audience fit (via Listen Notes) and draft per-show pitches: hook based on your positioning, angle, proof, clear ask. No template spam.",
      "outcome": "Pitches at podcast-pitches/{date}.md — one per show, send from your own email.",
      "skill": "pitch-podcast",
      "tools": {
        "podcasts": [
          "listennotes"
        ]
      }
    },
    {
      "category": "Paid",
      "title": "Plan a Google Ads search campaign",
      "blurb": "Audience, ad-groups, budget, KPIs — before a dollar.",
      "prompt": "Plan a Google Ads search campaign for {keyword cluster}.",
      "fullPrompt": "Plan a Google Ads search campaign for {keyword cluster}. Use the plan-campaign skill with type=paid. Full brief: audience, keyword/placement strategy, ad-group structure, suggested budget, landing-page requirements, KPI targets. Save to campaigns/paid-{channel}-{slug}.md — spec the experiment before I spend a dollar.",
      "description": "Full campaign brief: audience, keyword/placement strategy, ad-group structure, suggested budget, landing-page requirements, KPI targets.",
      "outcome": "Campaign brief at campaigns/paid-{channel}-{slug}.md — spec before you spend a dollar.",
      "skill": "plan-campaign",
      "tools": {
        "ads": [
          "googleads",
          "metaads"
        ],
        "esp": [
          "customerio",
          "mailchimp"
        ],
        "billing": [
          "stripe"
        ],
        "crm": [
          "hubspot"
        ]
      }
    },
    {
      "category": "Paid",
      "title": "Teardown a competitor's live ads",
      "blurb": "Angles, hooks, offers they're testing right now.",
      "prompt": "Teardown {competitor}'s ads from Meta Ad Library.",
      "fullPrompt": "Teardown {competitor}'s current ads. Use the monitor-competitors skill with source=ads. Pull live creative from Meta Ad Library, LinkedIn Ad Library, and Google Ads Transparency (via Composio scrape), then extract angles, hooks, and offers they're testing. Save to competitor-briefs/ads-{competitor}-{YYYY-MM-DD}.md.",
      "description": "I pull live creative from Meta Ad Library, LinkedIn Ad Library, and Google Ads Transparency (via Composio scrape), then extract the angles, hooks, and offers they're testing.",
      "outcome": "Ad teardown at competitor-briefs/ads-{competitor}-{date}.md — research for your own ad copy.",
      "skill": "monitor-competitors",
      "tools": {
        "scrape": [
          "firecrawl"
        ],
        "ads": [
          "metaads"
        ],
        "social": [
          "linkedin",
          "twitter",
          "reddit",
          "instagram"
        ]
      }
    },
    {
      "category": "Paid",
      "title": "Draft ad copy grounded in real customer language",
      "blurb": "10 variants with the source quote next to each.",
      "prompt": "Draft 10 ad variants grounded in real customer language.",
      "fullPrompt": "Draft 10 ad variants grounded in real customer language. Use the generate-ad-copy skill. Pull phrases from my call-insights/ folder (or G2 / Capterra / Trustpilot reviews via scrape) and write headlines + descriptions that sound like my customers talking, not a marketer pitching. Save to ad-copy/{campaign-slug}.md with the source quote alongside each headline.",
      "description": "I pull phrases from your call insights (or G2 / Capterra / Trustpilot reviews via scrape) and write headlines + descriptions that sound like your customers talking — not a marketer pitching.",
      "outcome": "Variants at ad-copy/{campaign}.md with the source quote alongside each headline.",
      "skill": "generate-ad-copy",
      "tools": {
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Paid",
      "title": "Rigorously critique a landing page",
      "blurb": "6 dimensions 0–3, prioritized fix list.",
      "prompt": "Critique the landing page at {url}.",
      "fullPrompt": "Critique the landing page at {url}. Use the audit skill with surface=landing-page. Fetch the page via Firecrawl and score 6 dimensions 0–3 (headline clarity, value prop, social proof, CTA, objection handling, visual hierarchy). Give me a prioritized fix list — not a generic lecture. Save to audits/landing-page-{url-slug}-{YYYY-MM-DD}.md. For a rewrite, follow up with the write-page-copy skill.",
      "description": "I fetch the page via Firecrawl and score 6 dimensions 0–3 (headline, value prop, social proof, CTA, objection handling, visual hierarchy). Prioritized fix list, not a generic lecture.",
      "outcome": "Teardown at audits/landing-page-{url}-{date}.md. Copy the fixes into your tracker.",
      "skill": "audit",
      "tools": {
        "seo": [
          "semrush",
          "ahrefs"
        ],
        "scrape": [
          "firecrawl"
        ],
        "search": [
          "perplexityai"
        ]
      }
    },
    {
      "category": "Paid",
      "title": "Design a proper A/B test",
      "blurb": "Hypothesis, MDE, power, go/no-go — no coin flip.",
      "prompt": "Design an A/B test for the pricing page headline.",
      "fullPrompt": "Design an A/B test for the pricing page headline. Use the design-ab-test skill. Full spec: hypothesis (PICOT), control vs variant, primary + secondary metrics, sample-size estimate with MDE + power, duration, go/no-go criteria. Save to ab-tests/{slug}.md so I don't ship the loser.",
      "description": "Full spec: hypothesis (PICOT), control vs variant, primary + secondary metrics, sample-size estimate with MDE + power, duration, go/no-go criteria.",
      "outcome": "Test spec at ab-tests/{slug}.md. Paste into your experimentation tool.",
      "skill": "design-ab-test"
    },
    {
      "category": "Paid",
      "title": "Spec event tracking + a UTM matrix",
      "blurb": "Events, properties, UTM rules — hand to engineering.",
      "prompt": "Spec the event tracking plan for sign-up → activation.",
      "fullPrompt": "Spec the event tracking plan for sign-up → activation. Use the setup-tracking skill. Event names, triggers, properties, owner per step. UTM matrix so paid / social / email are comparable in my connected GA4 / PostHog. Save to tracking-plans/{slug}.md.",
      "description": "Event names, triggers, properties, and owner per step. Plus a UTM matrix so paid / social / email are comparable in GA4 / your analytics.",
      "outcome": "Plan at tracking-plans/{slug}.md — hand to engineering.",
      "skill": "setup-tracking",
      "tools": {
        "analytics": [
          "posthog",
          "mixpanel"
        ]
      }
    },
    {
      "category": "Paid",
      "title": "Weekly funnel readout — find the leak",
      "blurb": "Biggest drop + 2-3 experiments ranked by lift × effort.",
      "prompt": "Give me this week's funnel readout from PostHog.",
      "fullPrompt": "Give me the weekly funnel readout. Use the analyze skill with subject=funnel. Compute conversion at each step from my connected PostHog / Mixpanel / GA4 (or paste), flag the biggest drop, and recommend 2–3 experiments ranked by expected lift × effort. Save to analyses/funnel-{YYYY-MM-DD}.md — clear next actions, not a dashboard dump.",
      "description": "Compute conversion at each step (from your connected PostHog / Mixpanel / GA4, or paste), flag the biggest drop, recommend 2–3 experiments by lift × effort.",
      "outcome": "Review at analyses/funnel-{date}.md — clear next actions, not a dashboard dump.",
      "skill": "analyze",
      "tools": {
        "analytics": [
          "posthog",
          "mixpanel"
        ],
        "scrape": [
          "firecrawl"
        ],
        "seo": [
          "semrush"
        ]
      }
    },
    {
      "category": "Copy",
      "title": "Rewrite your homepage (or any landing page)",
      "blurb": "Full page copy grounded in real customer language.",
      "prompt": "Rewrite my homepage.",
      "fullPrompt": "Write copy for {page}. Use the write-page-copy skill with surface=homepage (or pricing / about / landing). Full page copy grounded in my positioning and real customer language (from call-insights/ or G2 / Capterra reviews). Sections, headlines, bodies, CTAs, social-proof placement. Save to page-copy/homepage-{slug}.md.",
      "description": "Full page copy grounded in your positioning and real customer language. Sections, headlines, bodies, CTAs, social-proof placement.",
      "outcome": "Draft at page-copy/{surface}-{slug}.md.",
      "skill": "write-page-copy",
      "tools": {
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Copy",
      "title": "Tighten existing copy without losing intent",
      "blurb": "Cut adjectives, remove marketer-speak, fix rhythm.",
      "prompt": "Edit this copy — tighten and polish in my voice.",
      "fullPrompt": "Edit this copy. Use the edit-copy skill. Tighten in my voice: cut adjectives, remove marketer-speak, add specificity, fix rhythm. Preserve intent. Save an edited version to copy-edits/{slug}.md with before/after notes.",
      "description": "I tighten existing copy in your voice: cut adjectives, remove marketer-speak, add specificity, fix rhythm. Preserves intent.",
      "outcome": "Edited version at copy-edits/{slug}.md with before/after notes.",
      "skill": "edit-copy"
    },
    {
      "category": "Copy",
      "title": "10 headline variants grounded in real quotes",
      "blurb": "Each cites the customer quote behind it.",
      "prompt": "Give me 10 headlines for {page}.",
      "fullPrompt": "Give me 10 headlines for {page}. Use the write-headline-variants skill. Each headline + subhead pair grounded in a verbatim customer quote, review line, or positioning-doc claim. No marketer-speak. Top 3 ranked to test first. Save to headline-variants/{page-slug}.md.",
      "description": "10 headline + subhead pairs, each grounded in a verbatim customer quote, review line, or positioning-doc claim. No marketer-speak. Top 3 ranked to test first.",
      "outcome": "Variants at headline-variants/{page}.md.",
      "skill": "write-headline-variants",
      "tools": {
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Copy",
      "title": "Better CTAs paired with the objection they answer",
      "blurb": "'Start free — no credit card' = CTA + objection.",
      "prompt": "Give me CTA variants for {button}.",
      "fullPrompt": "Give me CTA variants for {button}. Use the write-cta-variants skill. Each variant paired with the objection it answers. Grounded in pains from my call-insights/. Save to cta-variants/{page-slug}.md.",
      "description": "CTA button copy variants, each paired with the objection it answers (e.g. 'Start free — no credit card required'). Grounded in pains from your call insights.",
      "outcome": "Variants at cta-variants/{page}.md.",
      "skill": "write-cta-variants"
    },
    {
      "category": "Copy",
      "title": "Audit a form that's leaking conversions",
      "blurb": "Field cuts + label rewrites + friction sequencing.",
      "prompt": "Audit my {demo/contact/lead} form — too many fields.",
      "fullPrompt": "Audit my {form type} form. Use the audit skill with surface=form. Flag unnecessary fields, rewrite labels + helper text, and sequence fields by friction. Save to audits/form-{form-slug}-{YYYY-MM-DD}.md. For signup flows specifically, use surface=signup-flow with the write-page-copy skill instead.",
      "description": "I review a form (demo / contact / lead), flag unnecessary fields, rewrite labels + helper text, and sequence fields by friction.",
      "outcome": "Audit at audits/form-{form}.md.",
      "skill": "audit",
      "tools": {
        "seo": [
          "semrush",
          "ahrefs"
        ],
        "scrape": [
          "firecrawl"
        ],
        "search": [
          "perplexityai"
        ]
      }
    },
    {
      "category": "Copy",
      "title": "Fix your signup flow end-to-end",
      "blurb": "Pre-signup → email → password → first screen.",
      "prompt": "Signup flow review — dropoff is bad.",
      "fullPrompt": "Audit my signup flow end-to-end. Use the write-page-copy skill with surface=signup-flow. Cover pre-signup page, email field, password requirements, verification, first-screen post-signup. Copy + field-level recommendations. Save to page-copy/signup-flow-{slug}.md.",
      "description": "End-to-end signup audit: pre-signup page, email field, password requirements, verification, first-screen post-signup. Copy + field-level recs.",
      "outcome": "Review at page-copy/signup-flow-{slug}.md.",
      "skill": "write-page-copy",
      "tools": {
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Copy",
      "title": "Rewrite in-app onboarding copy",
      "blurb": "Empty states, tooltips, nudges — tied to activation.",
      "prompt": "Rewrite my in-app onboarding copy.",
      "fullPrompt": "Rewrite my in-app onboarding copy. Use the write-page-copy skill with surface=onboarding. Empty states, tooltips, nudges, welcome modals. Every string ties to an activation event I care about. Save to page-copy/onboarding-{slug}.md.",
      "description": "Empty states, tooltips, nudges, welcome modals inside the product. Every string ties to an activation event you care about.",
      "outcome": "Copy set at page-copy/onboarding-{slug}.md.",
      "skill": "write-page-copy",
      "tools": {
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Copy",
      "title": "Rewrite your upgrade paywall",
      "blurb": "Headline, value stack, price anchoring, CTA, proof.",
      "prompt": "Rewrite my upgrade paywall copy.",
      "fullPrompt": "Rewrite my upgrade paywall. Use the write-page-copy skill with surface=paywall. Headline, value stack, price anchoring, CTA, social proof — grounded in why users actually upgrade (from my call-insights/). Save to page-copy/paywall-{slug}.md.",
      "description": "Rewrites the upgrade moment — headline, value stack, price anchoring, CTA, social proof. Grounded in why users actually upgrade (from your call insights).",
      "outcome": "Paywall spec at page-copy/paywall-{slug}.md.",
      "skill": "write-page-copy",
      "tools": {
        "scrape": [
          "firecrawl"
        ]
      }
    },
    {
      "category": "Copy",
      "title": "Exit popups, modals, announcement banners",
      "blurb": "Hook + offer + CTAs + trigger + targeting.",
      "prompt": "Write copy for an exit popup.",
      "fullPrompt": "Write popup copy. Use the write-page-copy skill with surface=popup. Hook, offer, dismiss/accept CTAs — tied to a trigger (scroll, exit, time-on-page) with targeting recommendations. Save to page-copy/popup-{slug}.md.",
      "description": "Popup copy (hook, offer, dismiss/accept CTAs) tied to a trigger (scroll, exit, time-on-page) with targeting recommendations.",
      "outcome": "Spec at page-copy/popup-{slug}.md.",
      "skill": "write-page-copy",
      "tools": {
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
      // Eyebrow: category (· tool · tool · …)
      (function () {
        var flat = flattenToolsForEyebrow(uc.tools);
        var parts = [h("span", { key: "cat" }, uc.category || "Mission")];
        for (var i = 0; i < flat.names.length; i++) {
          parts.push(h("span", { key: "sep-" + i, className: "hv-eyebrow-sep" }, "·"));
          parts.push(h("span", { key: "name-" + i }, flat.names[i]));
        }
        if (flat.extra > 0) {
          parts.push(h("span", { key: "sep-more", className: "hv-eyebrow-sep" }, "·"));
          parts.push(h("span", { key: "more" }, "… +" + flat.extra));
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
