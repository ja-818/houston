---
name: write-a-tutorial-for-feature
description: "A Diátaxis-aligned tutorial (learning-oriented) with Overview, Prerequisites, numbered steps with working code, Verify commands, Troubleshooting, and Next steps. Every code block runs."
version: 1
tags: ["engineering", "overview-action", "write-docs"]
category: "Docs"
featured: yes
integrations: ["stripe", "notion", "github", "gitlab", "perplexityai"]
image: "laptop"
---


# Write a tutorial for {feature}
**Use when:** Diátaxis-aligned  -  concrete end-to-end, working code.
**What it does:** A Diátaxis-aligned tutorial (learning-oriented) with Overview, Prerequisites, numbered steps with working code, Verify commands, Troubleshooting, and Next steps. Every code block runs.
**Outcome:** A tutorial at tutorials/{slug}.md ready for your docs site.
## Instructions
Run this as a user-facing action. Use the underlying `write-docs` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Write a tutorial for {feature}. Use the write-docs skill with type=tutorial. Diátaxis-aligned (learning-oriented, concrete end-to-end flow the reader runs). Sections: Overview, Prerequisites, Numbered steps with working code blocks, Verify, Troubleshooting (2-4 common errors), Next steps. Every code block must run. Save to tutorials/{slug}.md. Draft only  -  I never publish.
```
