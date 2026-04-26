---
name: draft-a-design-doc-for-feature
description: "A full design doc from a one-line feature brief - Context, Goals, Non-goals, Proposed design, Alternatives considered, Risks, Open questions. At least two real alternatives, not strawmen."
version: 1
tags: ["engineering", "overview-action", "draft-design-doc"]
category: "Development"
featured: yes
integrations: ["github", "perplexityai"]
image: "laptop"
inputs:
  - name: feature
    label: "Feature"
  - name: feature_slug
    label: "Feature Slug"
    required: false
prompt_template: |
  Draft a design doc for {{feature}}. Use the draft-design-doc skill. Read context/engineering-context.md so the design fits the stack + priorities. Sections: Context, Goals, Non-goals, Proposed design, Alternatives considered, Risks, Open questions. Name at least two real alternatives  -  not strawmen. Flag anything overlapping sensitiveAreas in the ledger. Save to design-docs/{{feature_slug}}.md. Where you had to assume, mark the assumption and ask me.
---


# Draft a design doc for {feature}
**Use when:** Context, goals, alternatives, risks  -  one skimmable doc.
**What it does:** A full design doc from a one-line feature brief  -  Context, Goals, Non-goals, Proposed design, Alternatives considered, Risks, Open questions. At least two real alternatives, not strawmen.
**Outcome:** A design doc at design-docs/{feature-slug}.md ready to circulate for async review.
## Instructions
Run this as a user-facing action. Use the underlying `draft-design-doc` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a design doc for {feature}. Use the draft-design-doc skill. Read context/engineering-context.md so the design fits the stack + priorities. Sections: Context, Goals, Non-goals, Proposed design, Alternatives considered, Risks, Open questions. Name at least two real alternatives  -  not strawmen. Flag anything overlapping sensitiveAreas in the ledger. Save to design-docs/{feature-slug}.md. Where you had to assume, mark the assumption and ask me.
```
