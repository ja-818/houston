import test from "node:test";
import assert from "node:assert/strict";
import {
  buildActionSkill,
  buildRoutineInput,
  defaultAssistantSetup,
} from "./personal-assistant-artifacts.ts";
import { missionById } from "./personal-assistant-missions.ts";

test("morning brief tutorial creates weekday cron", () => {
  const setup = defaultAssistantSetup({
    workspaceName: "Personal",
    assistantName: "Personal assistant",
    focus: "Help me plan.",
    approvalRule: "Ask first.",
  });
  setup.routineTime = "08:30";

  const routine = buildRoutineInput(
    missionById("morning-brief"),
    "Morning brief",
    "Prepare the day.",
    setup,
  );

  assert.equal(routine.schedule, "30 8 * * 1-5");
  assert.equal(routine.enabled, true);
});

test("tutorial action writes current Action frontmatter", () => {
  const skill = buildActionSkill(
    missionById("morning-brief"),
    "Morning brief",
    'Checks "calendar" and email.',
  );

  assert.match(skill, /name: prepare-my-morning-brief/);
  assert.match(skill, /featured: yes/);
  assert.match(skill, /integrations: \["gmail", "googlecalendar"\]/);
  assert.doesNotMatch(skill, /display_name/);
});
