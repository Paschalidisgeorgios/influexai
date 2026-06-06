import type { AgentChatMessage } from "../types";
import {
  buildUgcFlowSystemAppend,
  detectUgcFlowPhase,
} from "./ugc-creator-flow";

export function buildFlowSystemAppend(
  history: AgentChatMessage[],
  userMessage: string
): string {
  const ugcPhase = detectUgcFlowPhase(history, userMessage);
  return buildUgcFlowSystemAppend(ugcPhase);
}

export {
  UGC_CREATOR_STEP1_QUESTION,
  UGC_VIDEO_CONFIRM_QUESTION,
  detectUgcFlowPhase,
  isUgcCreatorIntent,
} from "./ugc-creator-flow";
