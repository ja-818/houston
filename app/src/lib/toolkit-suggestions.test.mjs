import test from "node:test";
import assert from "node:assert/strict";
import {
  TOOLKIT_SUGGESTIONS,
  deriveToolkitSuggestions,
} from "./toolkit-suggestions.ts";

test("returns empty when nothing is connected", () => {
  assert.deepEqual(deriveToolkitSuggestions(new Set()), []);
});

test("returns empty when connected toolkits do not match any suggestion", () => {
  assert.deepEqual(
    deriveToolkitSuggestions(new Set(["unknown-toolkit"])),
    [],
  );
});

test("returns one suggestion when a single matching toolkit is connected", () => {
  const out = deriveToolkitSuggestions(new Set(["googlesheets"]));
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "analyzeSpreadsheet");
});

test("a suggestion appears if ANY of its toolkits is connected", () => {
  const out = deriveToolkitSuggestions(new Set(["pipedrive"]));
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "manageCrm");
});

test("caps result at max (default 3) when many suggestions match", () => {
  const allTriggers = new Set([
    "linkedin",
    "gmail",
    "firecrawl",
    "notion",
    "googlesheets",
    "hubspot",
    "fireflies",
  ]);
  const out = deriveToolkitSuggestions(allTriggers);
  assert.equal(out.length, 3);
});

test("preserves TOOLKIT_SUGGESTIONS order when picking top N", () => {
  const allTriggers = new Set([
    "linkedin",
    "gmail",
    "firecrawl",
    "notion",
    "googlesheets",
  ]);
  const out = deriveToolkitSuggestions(allTriggers, 5);
  assert.deepEqual(
    out.map((s) => s.id),
    [
      "findLeadsLinkedin",
      "planMyDay",
      "researchAccount",
      "draftOutreach",
      "writeContent",
    ],
  );
});

test("respects an explicit max parameter", () => {
  const out = deriveToolkitSuggestions(
    new Set(["linkedin", "gmail", "firecrawl"]),
    2,
  );
  assert.equal(out.length, 2);
});

test("all suggestion toolkit slugs are lowercase normalized", () => {
  for (const suggestion of TOOLKIT_SUGGESTIONS) {
    for (const slug of suggestion.toolkits) {
      assert.equal(slug, slug.toLowerCase().trim(), `slug "${slug}" not normalized`);
    }
  }
});

test("all suggestion ids are unique", () => {
  const ids = TOOLKIT_SUGGESTIONS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});
