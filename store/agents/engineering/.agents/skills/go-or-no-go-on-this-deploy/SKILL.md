---
name: go-or-no-go-on-this-deploy
description: "Pre-deploy gate checklist (tests, migrations, flags, rollback, on-call, runbook). Green / yellow / red per gate and a final GO / NO-GO / SOFT-GO verdict with the condition spelled out."
version: 1
tags: ["engineering", "overview-action", "review-deploy-readiness"]
category: "Reliability"
featured: yes
integrations: ["github", "gitlab"]
image: "laptop"
inputs:
  - name: release
    label: "Release"
  - name: release_slug
    label: "Release Slug"
    required: false
prompt_template: |
  Is {{release}} ready to deploy? Use the review-deploy-readiness skill. Run the pre-deploy gate checklist: tests green, migrations backwards-compat, feature flags documented, rollback plan, on-call aware, runbook updated. Green / yellow / red per gate. Final verdict: GO / NO-GO / SOFT-GO with the condition. Save to deploy-readiness/{{release_slug}}.md. I never deploy  -  you click the button.
---


# GO or NO-GO on this deploy
**Use when:** Tests, migrations, flags, rollback, on-call, runbook.
**What it does:** Pre-deploy gate checklist (tests, migrations, flags, rollback, on-call, runbook). Green / yellow / red per gate and a final GO / NO-GO / SOFT-GO verdict with the condition spelled out.
**Outcome:** A verdict at deploy-readiness/{release}.md  -  decide whether to click deploy.
## Instructions
Run this as a user-facing action. Use the underlying `review-deploy-readiness` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Is {release} ready to deploy? Use the review-deploy-readiness skill. Run the pre-deploy gate checklist: tests green, migrations backwards-compat, feature flags documented, rollback plan, on-call aware, runbook updated. Green / yellow / red per gate. Final verdict: GO / NO-GO / SOFT-GO with the condition. Save to deploy-readiness/{release-slug}.md. I never deploy  -  you click the button.
```
