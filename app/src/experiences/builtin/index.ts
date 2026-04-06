import { defaultExperience } from "./default-experience";
import { researchAgent } from "./research-agent";
import { codeReviewer } from "./code-reviewer";
import { contentWriter } from "./content-writer";
import { projectManager } from "./project-manager";
import { dataAnalyst } from "./data-analyst";
import { customerSupport } from "./customer-support";
import { meetingAssistant } from "./meeting-assistant";
import { devOps } from "./dev-ops";
import type { ExperienceManifest } from "../../lib/types";

export const builtinExperiences: ExperienceManifest[] = [
  defaultExperience,
  projectManager,
  meetingAssistant,
  researchAgent,
  dataAnalyst,
  codeReviewer,
  devOps,
  contentWriter,
  customerSupport,
];
