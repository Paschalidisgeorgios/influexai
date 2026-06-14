import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildFlowSystemAppend } from "./flows";
import { MASTER_AGENT_SYSTEM_PROMPT } from "./tools-definition";
import {
  STUDIO_GUIDE_INSTRUCTIONS,
  STUDIO_KNOWLEDGE,
} from "./studioKnowledge";
import {
  extractCreatorFactsFromChat,
  formatCreatorProfileForPrompt,
  getCreatorProfile,
  updateCreatorProfile,
} from "./creatorMemory";
import {
  runAnthropicAgentTurn,
  type AnthropicMessageParam,
} from "./anthropic-agent";
import { executeAgentTool } from "./execute-tool";
import { AGENT_TOOL_STEP_LABELS } from "./tools-definition";
import type {
  AgentChatMessage,
  AgentOutputs,
  AgentStreamEvent,
  AgentToolName,
} from "./types";

const MAX_TOOL_ROUNDS = 8;

function toAnthropicMessages(
  history: AgentChatMessage[]
): AnthropicMessageParam[] {
  return history.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

function isAgentToolName(name: string): name is AgentToolName {
  return name in AGENT_TOOL_STEP_LABELS;
}

async function* emitTextChunks(text: string): AsyncGenerator<AgentStreamEvent> {
  const words = text.split(/(\s+)/);
  let buf = "";
  for (const w of words) {
    buf += w;
    if (buf.length >= 24) {
      yield { type: "text_delta", text: buf };
      buf = "";
      await new Promise((r) => setTimeout(r, 12));
    }
  }
  if (buf) yield { type: "text_delta", text: buf };
}

export async function* runMasterAgentStream(
  userMessage: string,
  history: AgentChatMessage[] = []
): AsyncGenerator<AgentStreamEvent> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    yield { type: "error", message: "Nicht eingeloggt." };
    return;
  }

  const messages: AnthropicMessageParam[] = [
    ...toAnthropicMessages(history),
    { role: "user", content: userMessage },
  ];

  const outputs: AgentOutputs = {};
  let totalCreditsUsed = 0;
  let lastCreditsLeft: number | undefined;
  let finalSummary = "";

  const creatorProfile = await getCreatorProfile(supabase, user.id);
  const creatorContext = formatCreatorProfileForPrompt(creatorProfile);
  const studioGuideBlock = `\n\n${STUDIO_GUIDE_INSTRUCTIONS}\n\n${STUDIO_KNOWLEDGE}${
    creatorContext ? `\n\n${creatorContext}` : ""
  }`;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const flowAppend = buildFlowSystemAppend(history, userMessage);
    const systemPrompt =
      MASTER_AGENT_SYSTEM_PROMPT + studioGuideBlock + flowAppend;

    const turn = await runAnthropicAgentTurn(systemPrompt, messages, {
      enableCaching: true,
    });

    if (!turn.ok) {
      yield { type: "error", message: turn.error };
      return;
    }

    if (turn.turn.text) {
      yield* emitTextChunks(turn.turn.text);
      finalSummary += turn.turn.text;
    }

    if (turn.turn.toolUses.length === 0) {
      if (Object.keys(outputs).length > 0) {
        yield { type: "outputs", outputs: { ...outputs } };
      }
      yield {
        type: "done",
        summary: finalSummary || "Alle Schritte abgeschlossen.",
      };
      if (lastCreditsLeft !== undefined) {
        yield {
          type: "credits",
          creditsLeft: lastCreditsLeft,
          totalUsed: totalCreditsUsed,
        };
      }
      void extractCreatorFactsFromChat(userMessage, finalSummary).then(
        async (partial) => {
          if (Object.keys(partial).length > 0) {
            await updateCreatorProfile(supabase, user.id, partial);
          }
        }
      );
      return;
    }

    messages.push({ role: "assistant", content: turn.turn.content });

    const toolResults: {
      type: "tool_result";
      tool_use_id: string;
      content: string;
    }[] = [];

    for (const tool of turn.turn.toolUses) {
      if (!isAgentToolName(tool.name)) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: JSON.stringify({ error: `Unbekanntes Tool: ${tool.name}` }),
        });
        continue;
      }

      yield {
        type: "tool_start",
        tool: tool.name,
        label: AGENT_TOOL_STEP_LABELS[tool.name],
      };

      const result = await executeAgentTool(tool.name, tool.input, outputs);

      if (result.ok) {
        totalCreditsUsed += result.creditsUsed;
        if (result.creditsLeft !== undefined) {
          lastCreditsLeft = result.creditsLeft;
        }
        yield {
          type: "tool_done",
          tool: tool.name,
          creditsUsed: result.creditsUsed,
        };
        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: JSON.stringify({ success: true, data: result.data }),
        });
      } else {
        yield {
          type: "tool_error",
          tool: tool.name,
          error: result.error,
        };
        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: JSON.stringify({ success: false, error: result.error }),
        });
      }
    }

    if (lastCreditsLeft !== undefined) {
      yield {
        type: "credits",
        creditsLeft: lastCreditsLeft,
        totalUsed: totalCreditsUsed,
      };
    }

    yield { type: "outputs", outputs: { ...outputs } };

    messages.push({
      role: "user",
      content: toolResults,
    });
  }

  yield {
    type: "error",
    message: "Maximale Tool-Runden erreicht. Bitte erneut versuchen.",
  };
}
