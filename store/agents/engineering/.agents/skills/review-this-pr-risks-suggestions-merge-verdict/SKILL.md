---
name: review-this-pr-risks-suggestions-merge-verdict
description: "I pull the diff + tests + description from GitHub / GitLab / Bitbucket, ground against the engineering context + sensitive areas, and write risks ranked security > correctness > perf > style with inline file:line suggestions and a merge verdict."
version: 1
tags: ["engineering", "overview-action", "review-pr"]
category: "Development"
featured: yes
integrations: ["github", "gitlab", "linear", "jira", "loops"]
image: "laptop"
inputs:
  - name: url
    label: "URL"
    placeholder: "e.g. https://example.com"
  - name: pr_slug
    label: "Pr Slug"
    required: false
prompt_template: |
  Review PR {{url}}. Use the review-pr skill. Pull the diff, tests, description, and linked issue from my connected GitHub / GitLab / Bitbucket. Read context/engineering-context.md for the quality bar and sensitive areas. Order risks: security > correctness > performance > style. Suggest inline changes by file:line. End with a verdict (merge / merge-with-changes / hold). Save to pr-reviews/{{pr_slug}}.md. Do NOT post to the PR  -  I'll paste if I want.
---


# Review this PR  -  risks, suggestions, merge verdict
**Use when:** Security > correctness > perf > style. Inline suggestions.
**What it does:** I pull the diff + tests + description from GitHub / GitLab / Bitbucket, ground against the engineering context + sensitive areas, and write risks ranked security > correctness > perf > style with inline file:line suggestions and a merge verdict.
**Outcome:** A review at pr-reviews/{pr-slug}.md I can skim in 60 seconds and paste if I want.
## Instructions
Run this as a user-facing action. Use the underlying `review-pr` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Review PR {url}. Use the review-pr skill. Pull the diff, tests, description, and linked issue from my connected GitHub / GitLab / Bitbucket. Read context/engineering-context.md for the quality bar and sensitive areas. Order risks: security > correctness > performance > style. Suggest inline changes by file:line. End with a verdict (merge / merge-with-changes / hold). Save to pr-reviews/{pr-slug}.md. Do NOT post to the PR  -  I'll paste if I want.
```
