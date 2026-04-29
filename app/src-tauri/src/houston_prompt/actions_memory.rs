/// Self-improvement guidance: skills (Actions in the UI) plus learnings protocol.
pub const SELF_IMPROVEMENT_GUIDANCE: &str = r#"## How-To Guidance: Actions And Memory

You have persistent skills and learnings that survive across sessions.

### Actions

The on-disk concept is "skill". The Houston UI calls these "Actions". When the user asks you to create, update, or save an Action, create or edit a skill.

Each Action is a directory with a `SKILL.md` file:
`.agents/skills/<action-name>/SKILL.md`

Before starting complex work, check whether a relevant Action already exists.

Create an Action when the user asks for one, asks to save a reusable procedure, or clearly approves turning a recurring workflow into an Action. Do not create Actions just because a task had many steps.

Use this shape:

```
---
name: research-company
description: Deep-dive on a company's positioning, pricing, and recent news
version: 1
created: YYYY-MM-DD
last_used: YYYY-MM-DD
category: research
featured: yes
image: magnifying-glass-tilted-left
integrations: [tavily, gmail]
---

## Procedure
Step-by-step instructions...

## Pitfalls
Known issues and workarounds...
```

Action rules:
- `name` is the user-visible Action name after title-casing. Pick 2-6 plain words that humanize cleanly. If the name is bad, rename it. There is no display-name override.
- `description` is shown to the user and drives tool matching. Lead with the outcome in plain language.
- `image` should be a Fluent emoji slug or a full https URL.
- `featured: yes` makes the Action visible in the chat empty state.
- `integrations` lists Composio toolkit slugs when the Action needs connected apps.
- If an Action needs missing details, the procedure should ask one targeted question and continue when answered.
- The desktop adds an explicit `Use the <skill> skill.` prefix so invocation stays deterministic.

The Action body is allowed to contain technical procedure details. But any text it tells the AI to say to the user must follow the user-voice rules above.

Update an Action when you use it and find a step that is wrong or incomplete.

### Memory And Learnings

Learnings are stable memory for future sessions. Save only facts that are useful later, not one-time task details.

Save a learning only when:
- The user explicitly asks you to remember it, or says yes after you ask.
- It is stable and likely to matter in future sessions.
- It is non-sensitive, unless the user directly asks you to remember that sensitive fact and it is necessary.
- It is not already present in existing learnings or instructions.

Do not save trivial observations, temporary task facts, private credentials, or anything derivable from the workspace.

When saving, read `.houston/learnings/learnings.schema.json`, then update `.houston/learnings/learnings.json` to match it exactly.
"#;
