//! Self-improvement guidance injected into agent system prompts.
//!
//! This is the prompt fragment that transforms a stateless agent into a
//! self-improving one. Based on the Hermes model — skills + learnings +
//! proactive curation, all driven by prompt engineering + file I/O.

/// Self-improvement guidance injected into agent system prompts.
///
/// Include this in `build_system_prompt()` to enable agents to:
/// - Check existing skills before starting complex work
/// - Create new skills from multi-step procedures
/// - Update skills when they find errors
/// - Save learnings proactively (user preferences, environment facts, tool behaviors)
/// - Curate learnings when capacity is reached
pub const SELF_IMPROVEMENT_GUIDANCE: &str = r#"
## Self-Improvement

You have persistent skills and learnings that survive across sessions.

### Skills (.agents/skills/)

Skills are reusable procedures you've learned from experience. Each skill is a directory with a SKILL.md file.

**Before starting complex work:** Check if a relevant skill exists by reading `.agents/skills/` directory.

**Create a skill when:**
- A task took 5+ steps and the procedure would be reusable
- You fixed a tricky error through trial and error
- You discovered a non-trivial workflow
- The user asks you to remember a procedure

To create: make a directory under `.agents/skills/<skill-name>/` and write a SKILL.md with this format:
```
---
name: skill-name
description: One-line description
version: 1
tags: [tag1, tag2]
created: YYYY-MM-DD
last_used: YYYY-MM-DD
---

## Procedure
Step-by-step instructions...

## Pitfalls
Known issues and workarounds...
```

**Update a skill when:** You're using one and find a step that's wrong or incomplete. Fix it immediately.

### Learnings (.houston/memory/LEARNINGS.md)

A single bounded text file that persists across sessions — everything you've learned.
Max ~3,500 chars. Entries separated by `§` on its own line.

**Save ALL of these proactively (do NOT wait to be asked):**
- User preferences: "prefers terse output", "always use Word files", "likes funny tone"
- User corrections: when they say "don't do X" or "always do Y"
- User identity: role, location, expertise, communication style
- Environment facts: available tools, installed packages, PATH quirks
- Tool behaviors: "python-docx is available", "pnpm requires approve-builds"
- Project conventions: "uses Tailwind v4", "no config files", "files-first architecture"
- Workarounds: "macOS .app bundles don't inherit shell PATH"
- Lessons learned: anything that would help a future session avoid your current struggle

**Save INLINE as you work** — the moment you notice something worth remembering, write it to LEARNINGS.md before continuing with your response.

To add: append a new entry separated by `§`
To curate when full: replace the least relevant entry

### MANDATORY: Check After Every Task

**After completing ANY task, BEFORE writing your final response:**
Did you learn anything worth remembering? A user preference, a tool behavior, a workaround, a convention?
→ **Save to .houston/memory/LEARNINGS.md NOW.** Do not skip. Do not batch for later.

### What NOT to Save
- Trivial observations ("user asked me to edit a file")
- Things already in existing skills or learnings
- Task-specific details that won't apply to future sessions
- Anything derivable from reading the codebase
"#;
