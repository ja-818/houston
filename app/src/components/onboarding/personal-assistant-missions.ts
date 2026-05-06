export type MissionId =
  | "morning-brief"
  | "email-draft"
  | "focus-block"
  | "follow-up-sweep"
  | "meeting-prep"
  | "weekly-recap";

export interface MissionTemplate {
  id: MissionId;
  skillName: string;
  integrations: string[];
  image: string;
  defaultTime: string;
  routineSchedule: (time: string) => string;
}

export const MISSIONS: MissionTemplate[] = [
  {
    id: "morning-brief",
    skillName: "prepare-my-morning-brief",
    integrations: ["gmail", "googlecalendar"],
    image: "calendar",
    defaultTime: "08:30",
    routineSchedule: weekdaysAt,
  },
  {
    id: "email-draft",
    skillName: "draft-an-email-reply",
    integrations: ["gmail"],
    image: "memo",
    defaultTime: "16:00",
    routineSchedule: weekdaysAt,
  },
  {
    id: "focus-block",
    skillName: "protect-a-focus-block",
    integrations: ["googlecalendar"],
    image: "alarm-clock",
    defaultTime: "09:00",
    routineSchedule: weekdaysAt,
  },
  {
    id: "follow-up-sweep",
    skillName: "sweep-my-follow-ups",
    integrations: ["gmail"],
    image: "incoming-envelope",
    defaultTime: "15:30",
    routineSchedule: weekdaysAt,
  },
  {
    id: "meeting-prep",
    skillName: "prep-my-next-meeting",
    integrations: ["gmail", "googlecalendar"],
    image: "spiral-notepad",
    defaultTime: "07:45",
    routineSchedule: weekdaysAt,
  },
  {
    id: "weekly-recap",
    skillName: "send-my-weekly-recap",
    integrations: ["gmail", "googlecalendar"],
    image: "bar-chart",
    defaultTime: "16:30",
    routineSchedule: fridayAt,
  },
];

export function missionById(id: MissionId): MissionTemplate {
  return MISSIONS.find((m) => m.id === id) ?? MISSIONS[0];
}

function weekdaysAt(time: string): string {
  const { hour, minute } = parseTime(time);
  return `${minute} ${hour} * * 1-5`;
}

function fridayAt(time: string): string {
  const { hour, minute } = parseTime(time);
  return `${minute} ${hour} * * 5`;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [rawHour, rawMinute] = time.split(":").map(Number);
  return {
    hour: Number.isFinite(rawHour) ? rawHour : 8,
    minute: Number.isFinite(rawMinute) ? rawMinute : 30,
  };
}
