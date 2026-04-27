import test from "node:test";
import assert from "node:assert/strict";
import { feedItemsToMessages } from "../src/feed-to-messages.ts";

test("attaches file changes to the previous assistant message after final result", () => {
  const messages = feedItemsToMessages([
    { feed_type: "user_message", data: "make a deck" },
    { feed_type: "assistant_text", data: "Done." },
    {
      feed_type: "final_result",
      data: { result: "Done.", cost_usd: null, duration_ms: 10 },
    },
    {
      feed_type: "file_changes",
      data: {
        created: ["/tmp/deck.pptx"],
        modified: ["/tmp/notes.txt"],
      },
    },
  ]);

  assert.equal(messages.length, 2);
  assert.deepEqual(messages[1].fileChanges, [
    { path: "/tmp/deck.pptx", status: "created" },
    { path: "/tmp/notes.txt", status: "modified" },
  ]);
});
