import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFrameLabels,
  buildMissionMeta,
  TUTORIAL_STEPS,
} from "./tutorial-copy.ts";

const t = (key, options) => {
  if (!options) return key;
  return Object.entries(options).reduce(
    (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
    key,
  );
};

test("tutorial covers three mission stages in order", () => {
  assert.deepEqual(TUTORIAL_STEPS, ["meet", "brain", "try"]);
});

test("mission meta exposes counter, title, body and the single next mission", () => {
  const meta = buildMissionMeta(t, "brain");
  assert.equal(meta.index, 1);
  assert.equal(meta.total, 3);
  assert.equal(meta.eyebrow, "setup:tutorial.eyebrow");
  assert.equal(meta.title, "setup:tutorial.missions.brain.title");
  assert.equal(meta.body, "setup:tutorial.missions.brain.body");
  assert.equal(meta.nextTitle, "setup:tutorial.missions.try.title");
});

test("final mission has no next mission", () => {
  const meta = buildMissionMeta(t, "try");
  assert.equal(meta.index, 2);
  assert.equal(meta.nextTitle, null);
});

test("frame labels expose brand, counter and up-next strings", () => {
  const labels = buildFrameLabels(t, "try");
  assert.equal(labels.brandLabel, "setup:tutorial.brand");
  assert.equal(labels.counterLabel, "setup:tutorial.counter");
  assert.equal(labels.upNextLabel, "setup:tutorial.upNext");
});
