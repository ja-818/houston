import { blankAgent } from "./default-experience";
import { agentCreator } from "./agent-creator";
import type { AgentConfig } from "../../lib/types";

export const builtinConfigs: AgentConfig[] = [
  blankAgent,
  agentCreator,
];
