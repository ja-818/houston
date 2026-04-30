import test from "node:test";
import assert from "node:assert/strict";
import { decodeActionMessage } from "../src/action-message.ts";

test("action marker decodes uploaded attachment metadata", () => {
  const body =
    '<!--houston:action {"skill":"review-contract","displayName":"Review contract","image":null,"description":"","integrations":[],"fields":[],"message":"Please check liability","attachments":[{"name":"msa.pdf","path":"/tmp/msa.pdf"}]}-->\n\nUse the review-contract skill.';

  assert.deepEqual(decodeActionMessage(body)?.attachments, [
    { name: "msa.pdf", path: "/tmp/msa.pdf" },
  ]);
});
