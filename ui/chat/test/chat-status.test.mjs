import test from "node:test";
import assert from "node:assert/strict";
import { deriveStatus } from "../src/chat-status.ts";

test("active session stays streaming after non-streaming feed item", () => {
  assert.equal(
    deriveStatus([{ feed_type: "assistant_text", data: "done so far" }], true),
    "streaming",
  );
});

test("inactive session becomes ready after final assistant text", () => {
  assert.equal(
    deriveStatus([{ feed_type: "assistant_text", data: "done" }], false),
    "ready",
  );
});
