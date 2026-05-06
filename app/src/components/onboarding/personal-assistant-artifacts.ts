import type { NewRoutine } from "@houston-ai/engine-client";
import type { SkillSummary } from "../../lib/types";
import type { MissionTemplate } from "./personal-assistant-missions";

export interface AssistantSetup {
  workspaceName: string;
  assistantName: string;
  color: string;
  focus: string;
  approvalRule: string;
  routineTime: string;
  routineEnabled: boolean;
}

export const PERSONAL_ASSISTANT_CONFIG_ID = "personal-assistant";

export function defaultAssistantSetup(labels: {
  workspaceName: string;
  assistantName: string;
  focus: string;
  approvalRule: string;
}): AssistantSetup {
  return {
    ...labels,
    color: "navy",
    routineTime: "08:30",
    routineEnabled: true,
  };
}

export function buildAssistantInstructions(setup: AssistantSetup, missionTitle: string): string {
  return `# ${setup.assistantName}

You are my Personal assistant in Houston.

## Main job
${setup.focus.trim()}

## First workflow
Set up and run: ${missionTitle}.

## Approval rule
${setup.approvalRule.trim()}

## How to work
- Prefer Actions for repeatable work.
- Prefer Routines for scheduled work.
- Use connected apps through Composio when a task needs inbox, calendar, documents, or other accounts.
- Ask one clear question when required information is missing.
- Keep updates short and practical.
- Never send messages, create calendar events, or change connected apps unless I approve first.
`;
}

export function buildActionSkill(
  mission: MissionTemplate,
  missionTitle: string,
  missionDescription: string,
): string {
  const integrations = mission.integrations.map((item) => `"${item}"`).join(", ");
  return `---
name: ${mission.skillName}
description: "${escapeYaml(missionDescription)}"
version: 1
category: Assistant
featured: yes
image: ${mission.image}
integrations: [${integrations}]
---

# ${missionTitle}

## Procedure
Use this Action when the user wants ${missionTitle.toLowerCase()}.

1. Confirm required connected apps are available: ${mission.integrations.join(", ")}.
2. Read only the information needed for the request.
3. Produce a short result with what mattered, what changed, and what needs approval.
4. Ask before sending email, creating calendar events, or changing connected apps.
5. If a connected app is missing, tell the user exactly which app to connect and stop.

## First run
Complete the tutorial run now. Use connected apps to gather real context. If there is nothing useful yet, say that clearly and suggest the next useful setup step.
`;
}

export function buildRoutineInput(
  mission: MissionTemplate,
  missionTitle: string,
  missionDescription: string,
  setup: AssistantSetup,
): NewRoutine {
  return {
    name: missionTitle,
    description: missionDescription,
    prompt: `Use the ${mission.skillName} skill. Run the scheduled version of ${missionTitle}. Ask before external changes.`,
    schedule: mission.routineSchedule(setup.routineTime),
    enabled: setup.routineEnabled,
    suppress_when_silent: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function actionSummary(
  mission: MissionTemplate,
  missionDescription: string,
): SkillSummary {
  return {
    name: mission.skillName,
    description: missionDescription,
    version: 1,
    tags: [],
    created: null,
    last_used: null,
    category: "Assistant",
    featured: true,
    integrations: mission.integrations,
    image: mission.image,
    inputs: [],
    prompt_template: null,
  };
}

export function firstRunPrompt(mission: MissionTemplate, missionTitle: string): string {
  return `Use the ${mission.skillName} skill.

Run my first Houston tutorial mission: ${missionTitle}.

Use connected apps when available. Do not send email, create calendar events, or change connected apps until I approve. Show me the useful result first, then ask what I want to do next.`;
}

function escapeYaml(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
