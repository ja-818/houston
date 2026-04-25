---
name: review-pr
description: "Use when you say 'review PR {url}' / 'look at this PR' / 'what's wrong with this diff' — I pull the diff, tests, description, and any linked issue from GitHub, GitLab, or Bitbucket, read the engineering context + sensitive areas, and write a risk-ordered review (security > correctness > perf > style) with inline file:line suggestions and a merge verdict. Writes to `pr-reviews/{pr-slug}.md`. Never comments on the PR, never merges."
integrations:
  dev: [github, gitlab, linear, jira]
---

# Review PR

## When to use

- Explicit: "review PR {url}", "review this PR", "what should I change before merging {url}", "risks on this PR".
- Implicit: user pastes diff or PR link, no other context.
- Safe per PR; re-run on updated PR to refresh review.

## Steps

1. **Read engineering context**: `context/engineering-context.md`. If missing/empty, tell user: "I need the engineering context doc before I can review anything well. Go chat with this agent's own `define-engineering-context` and run `define-engineering-context` first." Stop.
2. **Read config**: `config/stack.json`, `config/sensitive-areas.md`, `config/voice.md`. If any missing, ask ONE targeted question with best modality ("Paste 2-3 PR comments so I match your voice — or connect your code host via Composio and I'll pull your history"). Write and continue.
3. **Fetch PR via Composio.** Run `composio search code-hosting` to discover connected slug (GitHub / GitLab / Bitbucket / Gitea). Execute by slug to fetch: PR title, description, diff, files changed, tests touched, linked issue(s), review status. If diff too large to fully load, note which files sampled and which skipped. If user pasted raw diff instead of URL, use directly.
4. **Identify scope & sensitive-area overlap.** Cross-reference changed paths against `config/sensitive-areas.md`. Overlap bumps severity on findings in those files.
5. **Analyze, ordered by severity:**
   - **Security** — authz, injection, secrets, unsafe deserialization, missing input validation, crypto misuse, regressions in auth paths.
   - **Correctness** — logic bugs, race conditions, null/undefined handling, error paths, missing test coverage for new branches, contract changes that break consumers.
   - **Performance** — N+1 queries, unbounded loops, memory growth, inappropriate sync-over-async, missing indexes, expensive ops on hot paths.
   - **Style** — naming, structure, commit hygiene, PR size. Style last — never lead with it.
6. **Write review** to `pr-reviews/{pr-slug}.md` atomically (`*.tmp` → rename). Structure:
   - **Summary** — 2-3 sentences: what PR does and why.
   - **Verdict** — merge / merge-with-changes / hold + one-line rationale. Put near top, skimmable.
   - **Risks** — bulleted list in severity order (security > correctness > perf > style). Tie each to file:line.
   - **Suggested changes** — inline suggestions keyed by file:line, each with one-line before/after when clearer than prose.
   - **Tests** — note tests added, tests missing for new branches, and whether PR's test claims match diff.
   - **Linked issue** — if readable, confirm PR addresses issue requirements. Gap or issue not visible → mark UNKNOWN.
   - **Nitpicks** — pure style; optional.
   Tone matches `config/voice.md`.
7. **Append to `outputs.json`** — read existing array, add `{ id, type: "pr-review", title, summary, path, status: "draft", createdAt, updatedAt }`, write atomically.
8. **Summarize to user** — verdict, top 2-3 risks, path to full review. Remind: "I haven't posted this to the PR — paste what you want."

## Never invent

Every finding ties to real file:line, test file, or diff chunk. If diff hides something (truncated, binary, generated), mark UNKNOWN, no guess. Never post to PR. Never merge. Never close linked issue.

## Outputs

- `pr-reviews/{pr-slug}.md`
- Appends to `outputs.json` with type `pr-review`.