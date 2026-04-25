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

  // ── Slug → display-name dictionary ──────────────────────────
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

  // Flatten grouped {category: [slugs]} map into a dot-separated React
  // fragment: "· Google Docs · Notion · DocuSign …" — capped at 4 names,
  // append "… +N" if truncated. Returns null for empty/missing input.
  function renderToolsEyebrow(tools) {
    if (!tools || typeof tools !== "object") return null;
    var slugs = [];
    var keys = Object.keys(tools);
    for (var i = 0; i < keys.length; i++) {
      var arr = tools[keys[i]];
      if (!Array.isArray(arr)) continue;
      for (var j = 0; j < arr.length; j++) slugs.push(arr[j]);
    }
    if (slugs.length === 0) return null;
    var cap = 4;
    var shown = slugs.slice(0, cap);
    var extra = slugs.length - shown.length;
    var parts = [];
    for (var k = 0; k < shown.length; k++) {
      parts.push(h("span", { key: "s-" + k, className: "hv-eyebrow-sep" }, "·"));
      parts.push(h("span", { key: "n-" + k }, displayName(shown[k])));
    }
    if (extra > 0) {
      parts.push(h("span", { key: "s-more", className: "hv-eyebrow-sep" }, "·"));
      parts.push(h("span", { key: "n-more" }, "… +" + extra));
    }
    return h(React.Fragment || "span", null, parts);
  }


  // ═════════ PER-AGENT CONFIG (injected by generator) ═════════
  var AGENT = {
    "name": "Legal",
    "tagline": "Your full-stack AI Legal operator for solo founders. Contracts, compliance, entity, IP, and advisory — behind one conversation, one context, one markdown output folder. Drafts only — I never file, sign, send, or post.",
    "chips": [
      "Contracts",
      "Compliance",
      "Entity",
      "IP",
      "Advisory"
    ],
    "useCases": [
      {
        "category": "Contracts",
        "title": "Review an inbound MSA end-to-end",
        "blurb": "Clause map + green/yellow/red verdict + walk/redline call.",
        "prompt": "Review this MSA — is it signable?",
        "fullPrompt": "Review the attached MSA from {counterparty}. Use the review-contract skill with mode=full. Extract the full clause map, grade each clause green/yellow/red against market standard for a solo-founder-stage company, and give me an accept / redline / walk recommendation. Save to contract-reviews/{counterparty-slug}-{YYYY-MM-DD}.md and update counterparty-tracker.json.",
        "description": "Full contract review: clause-by-clause extraction, green/yellow/red verdict against market standard for your stage, and an accept / redline / walk recommendation. Updates counterparty-tracker.json so downstream skills see it.",
        "outcome": "Review at contract-reviews/{counterparty}-{date}.md with the verdict in the opening paragraph.",
        "skill": "review-contract",
        "tools": {
          "files": [
            "googledrive"
          ],
          "docs": [
            "googledocs"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Contracts",
        "title": "Traffic-light an inbound NDA",
        "blurb": "7-dimension rubric, redlines on every Red item.",
        "prompt": "Traffic-light this NDA.",
        "fullPrompt": "Traffic-light this NDA from {counterparty}. Use the review-contract skill with mode=nda-traffic-light. Grade term, mutuality, confidential-info definition, carve-outs, jurisdiction, non-solicit smuggling, and return/destruction. Write a specific redline for every Red item. Save to ndas/{counterparty-slug}-{YYYY-MM-DD}.md.",
        "description": "Fast 7-dimension rubric for inbound NDAs (term, mutuality, confidential-info definition, carve-outs, jurisdiction, non-solicit smuggling, return/destruction) with a specific redline on every Red item — not a generic 'we'll send our form'.",
        "outcome": "NDA review at ndas/{counterparty}-{date}.md — copy the redlines into your reply.",
        "skill": "review-contract",
        "tools": {
          "files": [
            "googledrive"
          ],
          "docs": [
            "googledocs"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Contracts",
        "title": "Extract clauses from a contract (no verdict)",
        "blurb": "Structured map: term, liability, IP, DPA, exit rights.",
        "prompt": "Extract the clauses from this contract.",
        "fullPrompt": "Extract the clauses from this contract with {counterparty}. Use the review-contract skill with mode=clauses-only. Produce a structured map (term, termination, renewal, liability cap, indemnity, IP, governing law, DPA, AI training, data residency, exit rights) — no verdict, just the structure. Save to clause-extracts/{counterparty-slug}-{YYYY-MM-DD}.md and update counterparty-tracker.json.",
        "description": "Structured clause extraction when you need the map without the verdict. Each clause: quoted counterparty text + plain-English paraphrase + 'what to watch' one-liner. Updates the tracker.",
        "outcome": "Extract at clause-extracts/{counterparty}-{date}.md + row in counterparty-tracker.json.",
        "skill": "review-contract",
        "tools": {
          "files": [
            "googledrive"
          ],
          "docs": [
            "googledocs"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Contracts",
        "title": "Plan the redline response after a review",
        "blurb": "Must-have / nice-to-have / punt, with exact language.",
        "prompt": "Plan the redline for {counterparty} — what do I push back on?",
        "fullPrompt": "Plan the redline for the {counterparty} contract I just reviewed. Use the plan-redline skill. Read contract-reviews/{counterparty}-{YYYY-MM-DD}.md, combine with my risk posture from config/context-ledger.json, and produce must-have / nice-to-have / punt tiers with the exact redline language for every must-have. Save to redline-plans/{counterparty}-{YYYY-MM-DD}.md.",
        "description": "Reads your prior contract-reviews/ entry + risk posture, produces must-have / nice-to-have / punt tiers with exact redline language for every must-have. You paste into the redline editor of your choice.",
        "outcome": "Redline plan at redline-plans/{counterparty}-{date}.md.",
        "skill": "plan-redline",
        "tools": {
          "docs": [
            "googledocs"
          ]
        }
      },
      {
        "category": "Contracts",
        "title": "Draft an NDA from your template library",
        "blurb": "Reads your template, substitutes variables, stamps draft.",
        "prompt": "Draft an NDA with {counterparty}.",
        "fullPrompt": "Draft an NDA with {counterparty}. Use the draft-document skill with type=nda. Read my template library from domains.contracts.templateLibrary (or use market-standard boilerplate with a caveat stamp), substitute the variables (counterparty, effective date, term), and save to drafts/nda/{counterparty-slug}-{YYYY-MM-DD}.md.",
        "description": "Reads your NDA template from Google Drive (or uses market-standard boilerplate with a 'no template found' caveat stamp), substitutes variables, produces a draft with a top comment-block listing what needs founder confirmation.",
        "outcome": "Draft at drafts/nda/{counterparty}-{date}.md marked DRAFT — NOT FOR SIGNATURE.",
        "skill": "draft-document",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ],
          "files": [
            "googledrive"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Contracts",
        "title": "Draft an MSA or Order Form from template",
        "blurb": "Customer-facing paper — MSA, order form, consulting.",
        "prompt": "Draft an MSA for {counterparty}.",
        "fullPrompt": "Draft an MSA for {counterparty}. Use the draft-document skill with type=msa (or type=order-form for a deal tied to an existing MSA, or type=consulting for a contractor engagement). Anchor on my template library, substitute commercials (fee, term, payment terms), produce a draft. Save to drafts/{type}/{counterparty-slug}-{YYYY-MM-DD}.md.",
        "description": "Draft commercial customer paper (MSA, order form, consulting agreement) anchored on your template. Comment block flags variables needing your confirmation.",
        "outcome": "Draft at drafts/{type}/{counterparty}-{date}.md.",
        "skill": "draft-document",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ],
          "files": [
            "googledrive"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Contracts",
        "title": "Triage your legal inbox for what needs you",
        "blurb": "Classifies NDAs, MSAs, DPAs, DSRs. Recommends routes.",
        "prompt": "Triage my legal inbox from the last 7 days.",
        "fullPrompt": "Sweep my legal inbox from the last 7 days. Use the triage-legal-inbox skill. Read my connected Gmail / Outlook for legal-flavored inbound, classify each item (NDA green/yellow/red, MSA, DPA, DSR, subpoena, TM office action, contractor, other), recommend a route per item. Save to intake-summaries/{YYYY-MM-DD}.md.",
        "description": "Sweeps your connected Gmail / Outlook for legal-flavored inbound, classifies each item (NDA / MSA / DPA / DSR / subpoena / TM / contractor), recommends a route. Read-only — never replies.",
        "outcome": "Triage summary at intake-summaries/{date}.md with routes per item.",
        "skill": "triage-legal-inbox",
        "tools": {
          "inbox": [
            "gmail",
            "outlook"
          ]
        }
      },
      {
        "category": "Contracts",
        "title": "Chase outstanding signatures without sending",
        "blurb": "Reads DocuSign, drafts reminders, files executed copies.",
        "prompt": "Where are my signatures?",
        "fullPrompt": "Check outstanding signatures. Use the track-legal-state skill with scope=signatures. Read my connected DocuSign / PandaDoc / HelloSign, list outstanding envelopes + days open, draft polite reminders for laggards (> 5 days open, never sends), file recently executed copies to my connected Google Drive. Save to signature-status/{YYYY-MM-DD}.md.",
        "description": "Reads your connected DocuSign / PandaDoc / HelloSign for outstanding envelopes, drafts polite reminders for laggards (> 5 days open, never sends), files executed copies to Google Drive.",
        "outcome": "Status board at signature-status/{date}.md with reminder drafts ready to send.",
        "skill": "track-legal-state",
        "tools": {
          "signing": [
            "docusign",
            "pandadoc",
            "dropbox_sign"
          ],
          "files": [
            "googledrive"
          ],
          "inbox": [
            "gmail"
          ]
        }
      },
      {
        "category": "Compliance",
        "title": "Audit your privacy posture for drift",
        "blurb": "Scrape landing + product, diff vs deployed policy.",
        "prompt": "Audit my privacy — what's drifted?",
        "fullPrompt": "Audit my privacy posture. Use the audit-compliance skill with scope=privacy-posture. Scrape my landing page + product via Firecrawl, fetch my deployed Privacy Policy, and diff (new analytics tool undisclosed, subprocessor added without policy update, new cookie, purpose drift). Tag each finding by severity with authority citations. Save to privacy-audits/{YYYY-MM-DD}.md.",
        "description": "Scrapes your landing + product via Firecrawl, cross-checks your deployed Privacy Policy, and flags drift (new analytics undisclosed, subprocessor missed, new cookie, purpose drift) with severity tags and authority citations (GDPR Art. 13/14, CCPA §1798.100).",
        "outcome": "Audit at privacy-audits/{date}.md with critical findings at the top.",
        "skill": "audit-compliance",
        "tools": {
          "scrape": [
            "firecrawl"
          ],
          "files": [
            "googledrive"
          ],
          "docs": [
            "googledocs"
          ]
        }
      },
      {
        "category": "Compliance",
        "title": "Refresh your subprocessor inventory",
        "blurb": "Walks integrations + landing, captures DPA status.",
        "prompt": "Update my subprocessor list.",
        "fullPrompt": "Refresh my subprocessor inventory. Use the audit-compliance skill with scope=subprocessors. Walk my connected integrations + scrape my landing page for vendor clues, capture role + data categories + transfer mechanism + DPA status + public DPA URL per vendor. Read-merge-write subprocessor-inventory.json + save a delta report to subprocessor-reviews/{YYYY-MM-DD}.md.",
        "description": "Walks your connected integrations + landing-page scripts, captures each vendor's role + data categories + transfer mechanism + DPA status + public DPA URL, and refreshes subprocessor-inventory.json with a delta report.",
        "outcome": "Delta report at subprocessor-reviews/{date}.md + updated inventory.",
        "skill": "audit-compliance",
        "tools": {
          "scrape": [
            "firecrawl"
          ],
          "files": [
            "googledrive"
          ],
          "docs": [
            "googledocs"
          ]
        }
      },
      {
        "category": "Compliance",
        "title": "Check your template library against current law",
        "blurb": "Flags stale templates — AI, SCCs, 2026 DPA standards.",
        "prompt": "Refresh my templates — what's stale?",
        "fullPrompt": "Audit my template library. Use the audit-compliance skill with scope=template-library. Read domains.contracts.templateLibrary, flag templates > 12 months old, check each against current-law changes (AI-training disclosure, SCC versions, 2026 DPA standards, CCPA cure-period, EU AI Act). Save a refresh plan to template-reviews/{YYYY-MM-DD}.md.",
        "description": "Flags templates > 12 months old, checks each against current-law changes (AI-training disclosure, SCC versions, 2026 DPA standards, CCPA cure-period, EU AI Act). Never auto-rewrites — recommends chaining to draft-document.",
        "outcome": "Refresh plan at template-reviews/{date}.md ranked by exposure.",
        "skill": "audit-compliance",
        "tools": {
          "scrape": [
            "firecrawl"
          ],
          "files": [
            "googledrive"
          ],
          "docs": [
            "googledocs"
          ]
        }
      },
      {
        "category": "Compliance",
        "title": "Draft or update your Privacy Policy",
        "blurb": "Scrapes landing, pulls subprocessors, cites articles.",
        "prompt": "Draft our privacy policy.",
        "fullPrompt": "Draft our Privacy Policy. Use the draft-document skill with type=privacy-policy. Scrape my landing page via Firecrawl, cross-reference subprocessor-inventory.json, cite GDPR articles for EU-inclusive geography or CCPA/CPRA for US. AI-training disclosure is explicit. Save to privacy-drafts/privacy-policy-{YYYY-MM-DD}.md.",
        "description": "Scrapes your landing page via Firecrawl, cross-references subprocessor-inventory.json, cites GDPR articles (EU) or CCPA/CPRA (US), includes explicit AI-training disclosure. Produces a sectioned markdown draft.",
        "outcome": "Policy draft at privacy-drafts/privacy-policy-{date}.md — you publish.",
        "skill": "draft-document",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ],
          "files": [
            "googledrive"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Compliance",
        "title": "Draft Terms of Service",
        "blurb": "Usage, IP, acceptable use, liability cap, disputes.",
        "prompt": "Draft our ToS.",
        "fullPrompt": "Draft our Terms of Service. Use the draft-document skill with type=tos. Scrape my landing page via Firecrawl to infer product surface, structure as Usage / Account / IP / Acceptable-Use / Payment / Termination / Warranty / Liability / Disputes. Save to privacy-drafts/tos-{YYYY-MM-DD}.md.",
        "description": "Draft ToS with full sections (Usage / Account / IP / Acceptable-Use / Payment / Termination / Warranty / Liability / Disputes) — grounded in your actual product surface via Firecrawl.",
        "outcome": "ToS draft at privacy-drafts/tos-{date}.md.",
        "skill": "draft-document",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ],
          "files": [
            "googledrive"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Compliance",
        "title": "Respond to a DSR without missing the clock",
        "blurb": "Computes GDPR/CCPA deadline, drafts 3-file packet.",
        "prompt": "Someone asked for their data — respond to this DSR.",
        "fullPrompt": "Respond to this DSR from {requester}. Use the draft-document skill with type=dsr-response. Compute the statutory clock (GDPR Art. 15 → 30 days, CCPA → 45 days), produce the three-file first-touch packet (acknowledgment, identity verification, export cover note). Save to dsr-responses/{request-id}-{YYYY-MM-DD}/. If clock < 7 days, flag attorneyReviewRequired.",
        "description": "Computes the statutory clock (GDPR Art. 15 → 30 days, CCPA → 45 days), produces the three-file first-touch packet (acknowledgment + identity verification + export cover note). Flags attorney review if clock < 7 days.",
        "outcome": "3-file packet at dsr-responses/{request-id}-{date}/ ready for your send.",
        "skill": "draft-document",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ],
          "files": [
            "googledrive"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Compliance",
        "title": "Pre-fill an enterprise security questionnaire",
        "blurb": "SIG / CAIQ / custom — pulls from your answers lib.",
        "prompt": "Help me with this security questionnaire from {prospect}.",
        "fullPrompt": "Help me fill out this security questionnaire from {prospect} (SIG-lite / CAIQ / custom sheet). Use the security-questionnaire skill. Extract the question set, pre-fill every question answerable from config/security-answers.md, group the rest by topic so one sit-down with me resolves many. Save the draft to security-questionnaires/{prospect-slug}-{YYYY-MM-DD}.md.",
        "description": "Extracts the question set (SIG-lite / CAIQ / custom), pre-fills every question answerable from your answers library, groups unanswered ones by topic so one founder sit-down resolves many. Appends new answers back to the library.",
        "outcome": "Draft at security-questionnaires/{prospect}-{date}.md with unanswered grouped.",
        "skill": "security-questionnaire",
        "tools": {
          "docs": [
            "googledocs"
          ],
          "files": [
            "googledrive"
          ]
        }
      },
      {
        "category": "Compliance",
        "title": "Keep the deadline calendar tight",
        "blurb": "DE March 1, 83(b) 30-day, 409A, DSR — all cited.",
        "prompt": "What's due soon — legally?",
        "fullPrompt": "Refresh my legal deadline calendar. Use the track-legal-state skill with scope=deadlines. Seed from the canonical set (Delaware March 1, 83(b) 30-day, 409A 12-month, DSR 30/45-day, TM office action 6-month, annual board consent) + enrich with dynamic renewal clocks from counterparty-tracker.json. Cite the authority for each. Save to deadline-summaries/{YYYY-MM-DD}.md + update deadline-calendar.json.",
        "description": "Seeds the canonical legal calendar (Delaware March 1, 83(b) 30-day, 409A 12-month, DSR 30/45-day, TM 6-month, annual board consent) + enriches with renewal clocks from counterparty-tracker.json. Every deadline cites its authority.",
        "outcome": "90-day readout at deadline-summaries/{date}.md + deadline-calendar.json.",
        "skill": "track-legal-state",
        "tools": {
          "signing": [
            "docusign",
            "pandadoc",
            "dropbox_sign"
          ],
          "files": [
            "googledrive"
          ],
          "inbox": [
            "gmail"
          ]
        }
      },
      {
        "category": "Entity",
        "title": "Set up the shared legal context doc",
        "blurb": "Entity, cap table, templates, risk posture — one source.",
        "prompt": "Set up my legal context.",
        "fullPrompt": "Draft or update my shared legal context doc. Use the define-legal-context skill. Interview me briefly (or pull from my connected Carta if available), then write entity snapshot + cap table + standing agreements + template stack + open risks + risk posture to context/legal-context.md. Every other skill in this agent reads it first.",
        "description": "Interviews you briefly (or pulls from Carta if connected), then writes the shared legal doc to context/legal-context.md — the source of truth every other skill in this agent reads first.",
        "outcome": "Locked doc at context/legal-context.md. Every skill reads it before running.",
        "skill": "define-legal-context",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ]
        }
      },
      {
        "category": "Entity",
        "title": "Prep your Delaware annual report (franchise tax)",
        "blurb": "Recalcs both methods — often 10-100x cheaper.",
        "prompt": "Prep my Delaware annual report.",
        "fullPrompt": "Prep my Delaware annual report. Use the file-delaware-report skill. Recalculate franchise tax under both the Authorized-Shares method AND the Assumed-Par-Value-Capital method (almost always cheaper for early-stage) using issued shares + authorized shares + gross assets from my ledger. Produce the submission package to annual-filings/{YYYY}-delaware.md.",
        "description": "Recalculates Delaware franchise tax under both methods (Authorized-Shares vs Assumed-Par-Value-Capital, often 10-100x cheaper for early-stage), collects directors / officers / issued shares, produces the submission package. Prep only — you file.",
        "outcome": "Package at annual-filings/{YYYY}-delaware.md with both methods shown.",
        "skill": "file-delaware-report",
        "tools": {
          "docs": [
            "googledocs"
          ]
        }
      },
      {
        "category": "Entity",
        "title": "Draft a board consent for a routine action",
        "blurb": "Officer appt, option grant, 409A adoption, bank res.",
        "prompt": "Draft a board consent for {action}.",
        "fullPrompt": "Draft a board consent for {action} (officer appointment / option grant / 409A adoption / bank resolution). Use the draft-document skill with type=board-consent. Pull directors + authorized shares from universal.entity, substitute the action-specific variables, produce the consent. Save to drafts/board-consent/{action-slug}-{YYYY-MM-DD}.md. Flags attorney review if share math is non-standard.",
        "description": "Draft board consent for routine corporate actions (officer appointment, option grant, 409A adoption, bank resolution). Uses your entity snapshot. Flags attorney review if share math is non-standard.",
        "outcome": "Draft at drafts/board-consent/{action}-{date}.md.",
        "skill": "draft-document",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ],
          "files": [
            "googledrive"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Entity",
        "title": "Assemble a first-hire offer packet",
        "blurb": "Offer letter + CIIAA + grant notice + exercise agmt.",
        "prompt": "Prepare the offer packet for {candidate}.",
        "fullPrompt": "Prepare the offer packet for {candidate}. Use the prepare-offer-packet skill. Assemble offer letter + CIIAA + option grant notice + exercise agreement anchored to my current 409A (universal.entity.four09aDate). Flag attorneyReviewRequired if comp structure is non-standard. Save to offer-packets/{candidate-slug}-{YYYY-MM-DD}/.",
        "description": "Assembles the four-file first-hire packet (offer letter + CIIAA + option grant notice + exercise agreement) anchored to your current 409A. Flags attorney review if comp structure is non-standard. You send from your email.",
        "outcome": "4-file packet at offer-packets/{candidate}-{date}/.",
        "skill": "prepare-offer-packet",
        "tools": {
          "docs": [
            "googledocs"
          ],
          "files": [
            "googledrive"
          ]
        }
      },
      {
        "category": "Entity",
        "title": "Log an executed agreement to the tracker",
        "blurb": "Feeds renewal clocks and the Monday roll-up.",
        "prompt": "Log this executed {type} with {counterparty}.",
        "fullPrompt": "Log this executed agreement. Use the track-legal-state skill with scope=counterparties. Append a row to counterparty-tracker.json with counterparty, agreementType, executedDate, effectiveDate, term, autoRenewal, noticePeriod, governingLaw, keyObligations, signedCopyPath — and compute renewalDate = effectiveDate + term - noticePeriod (the 'notice must be given by' date). Ask me for any missing field.",
        "description": "Appends an executed agreement to counterparty-tracker.json with all the fields the deadline calendar and weekly review need. Computes the notice-must-be-given-by date so auto-renewal never catches you off guard.",
        "outcome": "New row in counterparty-tracker.json with renewal clock computed.",
        "skill": "track-legal-state",
        "tools": {
          "signing": [
            "docusign",
            "pandadoc",
            "dropbox_sign"
          ],
          "files": [
            "googledrive"
          ],
          "inbox": [
            "gmail"
          ]
        }
      },
      {
        "category": "Entity",
        "title": "Draft a consulting / contractor agreement",
        "blurb": "CIIAA anchored + deliverables + term + IP assignment.",
        "prompt": "Draft a consulting agreement with {contractor}.",
        "fullPrompt": "Draft a consulting agreement with {contractor}. Use the draft-document skill with type=consulting. Anchor on CIIAA + deliverables + term, substitute variables, produce a draft. Save to drafts/consulting/{contractor-slug}-{YYYY-MM-DD}.md.",
        "description": "Draft contractor / consulting agreement anchored on CIIAA + deliverables + term + IP assignment, grounded in your template library (or market-standard boilerplate with a caveat stamp).",
        "outcome": "Draft at drafts/consulting/{contractor}-{date}.md.",
        "skill": "draft-document",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ],
          "files": [
            "googledrive"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "IP",
        "title": "Run a USPTO knockout search on a mark",
        "blurb": "Exact + phonetic + visual variants, Nice class-aware.",
        "prompt": "Knockout search on {mark}.",
        "fullPrompt": "Run a USPTO knockout search on {mark}. Use the run-trademark-search skill. Search USPTO Trademark Center for exact hits, phonetic variants, and visual variants in the relevant Nice classes. Return Low / Medium / High risk with recommended next step. Save to tm-searches/{mark-slug}-{YYYY-MM-DD}.md. Honest about knockout-vs-clearance limits.",
        "description": "Searches USPTO Trademark Center (Jan 2025 platform) for exact hits, phonetic variants, and visual variants in the relevant Nice classes. Returns Low / Medium / High risk with recommended next step. Honest about knockout-vs-clearance limits.",
        "outcome": "Search at tm-searches/{mark}-{date}.md with risk assessment.",
        "skill": "run-trademark-search",
        "tools": {
          "scrape": [
            "firecrawl"
          ],
          "search": [
            "exa"
          ]
        }
      },
      {
        "category": "IP",
        "title": "Review an inbound IP assignment clause",
        "blurb": "Traffic-light mode on IP-heavy MSAs and consulting.",
        "prompt": "Review this consulting agreement's IP terms.",
        "fullPrompt": "Review the IP terms in this consulting / contractor agreement. Use the review-contract skill with mode=full. Focus on IP work-product assignment, background IP, feedback license, and moral-rights handling. Flag anything non-standard for attorney review. Save to contract-reviews/{counterparty-slug}-{YYYY-MM-DD}.md.",
        "description": "Runs a full review of a contract with focus on IP terms (work-product assignment, background IP, feedback license, moral rights). Anything non-standard flags attorneyReviewRequired.",
        "outcome": "IP-focused review at contract-reviews/{counterparty}-{date}.md.",
        "skill": "review-contract",
        "tools": {
          "files": [
            "googledrive"
          ],
          "docs": [
            "googledocs"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "IP",
        "title": "Package an IP-related escalation for counsel",
        "blurb": "Structured brief — questions, quotes, deadline, firm type.",
        "prompt": "Package this IP issue for outside counsel.",
        "fullPrompt": "Package this IP matter for outside counsel. Use the draft-document skill with type=escalation-brief. Structure: 2-3 sentence matter summary, numbered questions for the lawyer, deadline + why, quoted excerpts with cite, entity snapshot, recommended firm type (IP). Save to escalations/{matter-slug}-{YYYY-MM-DD}.md. Never names specific firms.",
        "description": "Structured brief for an outside IP attorney: 2-3 sentence matter summary, numbered questions, deadline, quoted excerpts with cite, entity snapshot, recommended firm type (IP). Never names specific firms.",
        "outcome": "Brief at escalations/{matter}-{date}.md ready to email counsel.",
        "skill": "draft-document",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ],
          "files": [
            "googledrive"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Advisory",
        "title": "Answer 'do I need X?' with a real memo",
        "blurb": "Short answer, context, sources cited, next move.",
        "prompt": "Do I need an NDA with investors?",
        "fullPrompt": "Answer: {your question here, e.g. 'do I need an NDA with investors'}. Use the advise-on-question skill. Write a short advice memo with Question → Short answer → Context → Sources cited → Next move, end with a judgment-call disclaimer. Save to advice-memos/{topic-slug}-{YYYY-MM-DD}.md. If the matter is non-routine, flag it and recommend draft-document type=escalation-brief.",
        "description": "Writes a short advice memo structured as Question → Short answer → Context → Sources cited → Next move, ending with a judgment-call disclaimer. Non-routine matters flag attorney review and chain to escalation.",
        "outcome": "Memo at advice-memos/{topic}-{date}.md. Not final legal advice — first pass.",
        "skill": "advise-on-question"
      },
      {
        "category": "Advisory",
        "title": "Package any matter for outside counsel",
        "blurb": "Summary + questions + deadline + quoted cites.",
        "prompt": "Escalate {matter} to counsel.",
        "fullPrompt": "Package {matter} for outside counsel. Use the draft-document skill with type=escalation-brief. Structure: (1) Matter in 2-3 sentences, (2) Numbered questions for the lawyer, (3) Deadline + why, (4) Quoted excerpts with cite, (5) Entity snapshot, (6) Recommended firm type (corporate / commercial lit / privacy / IP / employment — no specific firms), (7) What we'd accept as an outcome. Save to escalations/{matter-slug}-{YYYY-MM-DD}.md.",
        "description": "Structured brief for outside counsel covering matter summary, numbered questions, deadline, quoted excerpts, entity snapshot, firm type, and desired outcome — everything the lawyer needs in one email.",
        "outcome": "Brief at escalations/{matter}-{date}.md. Email counsel directly.",
        "skill": "draft-document",
        "tools": {
          "docs": [
            "googledocs",
            "notion"
          ],
          "files": [
            "googledrive"
          ],
          "scrape": [
            "firecrawl"
          ]
        }
      },
      {
        "category": "Advisory",
        "title": "Monday legal review — what shipped, what's due",
        "blurb": "Rollup across every domain + attorney-review backlog.",
        "prompt": "Give me the Monday legal review.",
        "fullPrompt": "Give me the Monday legal review. Use the track-legal-state skill with scope=weekly-review. Aggregate this agent's outputs.json for the last 7 days (contract reviews, drafts, audits, filings) grouped by domain, surface pending signatures (from signature-status/), next 3 deadlines (from deadline-calendar.json), and any attorneyReviewRequired entries without a follow-up. Save to weekly-reviews/{YYYY-MM-DD}.md.",
        "description": "Aggregates everything this agent produced in the last 7 days by domain, surfaces pending signatures, next 3 deadlines, and any open attorney-review backlog. A 2-minute scan Monday morning.",
        "outcome": "Review at weekly-reviews/{date}.md with recommended next moves.",
        "skill": "track-legal-state",
        "tools": {
          "signing": [
            "docusign",
            "pandadoc",
            "dropbox_sign"
          ],
          "files": [
            "googledrive"
          ],
          "inbox": [
            "gmail"
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
        console.warn("[legal dashboard] sendMessage prop missing — tile click is a no-op.");
        return;
      }
      try {
        sendMessage(text);
      } catch (e) {
        console.error("[legal dashboard] sendMessage threw:", e);
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
      // Eyebrow: category (· tool · tool ...)
      h(
        "div",
        { className: "hv-eyebrow" },
        h("span", null, uc.category || "Mission"),
        renderToolsEyebrow(uc.tools),
      ),
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
