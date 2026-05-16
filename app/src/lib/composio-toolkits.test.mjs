import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeToolkitSlug,
  normalizeToolkitSlugs,
} from "./composio-toolkits.ts";

test("normalizes toolkit slugs for query matching", () => {
  assert.equal(normalizeToolkitSlug(" POSTHOG "), "posthog");
});

test("dedupes and sorts connected toolkit slugs", () => {
  assert.deepEqual(
    normalizeToolkitSlugs(["GMAIL", "posthog", "gmail", "", " PostHog "]),
    ["gmail", "posthog"],
  );
});
