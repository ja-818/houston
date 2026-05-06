import { blankAgent } from "./default-experience";
import { personalAssistantAgent } from "./personal-assistant";
import type { AgentConfig } from "../../lib/types";

export const builtinConfigs: AgentConfig[] = [
  personalAssistantAgent,
  blankAgent,
];
