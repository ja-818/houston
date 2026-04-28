---
name: digest-linkedin-activity
description: "Use when you say 'LinkedIn digest' / 'how did my posts do' / 'weekly LinkedIn roundup'  -  I pull stats on your own posts (reach, engagement, new followers) plus notable posts in your network worth commenting on. A 5-minute read. Writes to `linkedin-digests/{date}.md` for Monday morning."
version: 1
tags: [marketing, digest, linkedin]
category: Marketing
featured: yes
image: megaphone
integrations: [linkedin]
---


# Digest LinkedIn Activity

## When to use

- User: "LinkedIn digest" / "how did my posts do this week" / "weekly
  LinkedIn roundup" / "what did my network post".
- Weekly  -  Friday / Sunday-evening routine.

## Steps

1. **Read positioning doc**:
   `context/marketing-context.md`. If missing or
   empty, stop. Tell user run `define-positioning` first.

2. **Read `config/platforms.json`, `config/topics.json`.** Confirm
   LinkedIn in `active` and `connectedViaComposio`. If not connected,
   tell user link via Integrations tab and stop  -  skill needs API.

3. **Pull own-post stats.** Run `composio search linkedin` to find
   post-stats / list-own-posts tool. Execute. Pull user posts from
   last 7 days with:
   - impressions / reach
   - reactions / comments / shares / reposts
   - new followers gained that day if available
   Missing metric → mark TBD, note likely cause
   (e.g. "LinkedIn API doesn't expose per-post new-follower delta").

4. **Pull network posts.** Same LinkedIn category, find feed-read
   tool. Pull last 7 days from user connections. Filter for
   high-engagement (top decile by reactions) OR topical relevance to
   `config/topics.json`. Keep top 5-10.

5. **Compute roundup.** Produce:
   - **Your week at a glance**  -  post count, total impressions, total
     engagement, follower delta, best post, worst post.
   - **Patterns**  -  one-line read on what worked (hook length, topic,
     time-of-day if surfaceable). Cite specific posts.
   - **Network highlights**  -  5-10 connection posts worth reaction or
     reply. Each: one-line relevance + suggested action (reply / react
     / ignore).

6. **Write** to `linkedin-digests/{YYYY-MM-DD}.md` atomically.
   Structure:
   ```markdown
   # LinkedIn Digest  -  week ending {YYYY-MM-DD}

   ## Your week
   - Posts: {N}
   - Impressions: {total} ({delta vs prior week})
   - Engagement: {reactions} reactions · {comments} comments · {shares} shares
   - New followers: {count or TBD}
   - Best post: [{title or hook}]({url})  -  {metric}
   - Worst post: [{title or hook}]({url})  -  {metric}

   ## What worked
   - {one-line pattern, cited}
   - {one-line pattern, cited}

   ## Network highlights
   1. **{Author}**  -  {one-line post summary} ({URL})
      Suggested action: {reply / react / ignore} · {why}
   2. ...

   ---

   ## Notes
   - Data freshness: pulled {ISO timestamp}
   - Any TBDs: {list}
   ```

7. **Append to `outputs.json`**  -  new entry, `type:
   "linkedin-digest"`, `path:
   "linkedin-digests/{YYYY-MM-DD}.md"`, `status: "draft"`.

8. **Summarize to user**  -  one paragraph: "Week ending {date}: {N}
   posts, {impressions} impressions, best was {title} ({metric}).
   {count} network highlights flagged. Full digest at {path}."

## Outputs

- `linkedin-digests/{YYYY-MM-DD}.md`
- Appends to `outputs.json` with `{ id, type: "linkedin-digest",
  title, summary, path, status: "draft", createdAt, updatedAt }`.