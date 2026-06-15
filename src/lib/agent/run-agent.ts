import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildFlowSystemAppend } from "./flows";
import {
  AGENT_META_TOOL_STEP_LABELS,
  AGENT_TOOL_STEP_LABELS,
  MASTER_AGENT_SYSTEM_PROMPT,
} from "./tools-definition";
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
import {
  normalizeAgentTrendInsight,
  SUBMIT_TREND_INSIGHT_TOOL,
} from "./structured-insight";
import type {
  AgentChatMessage,
  AgentOutputs,
  AgentStreamEvent,
  AgentToolName,
  AgentTrendInsight,
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

async function* emitTrendInsight(
  insight: AgentTrendInsight
): AsyncGenerator<AgentStreamEvent> {
  yield { type: "insight", insight };
}

async function forceSubmitTrendInsight(
  systemPrompt: string,
  messages: AnthropicMessageParam[],
  draftAnswer: string
): Promise<AgentTrendInsight | null> {
  const structureMessages: AnthropicMessageParam[] = [
    ...messages,
    {
      role: "user",
      content: draftAnswer.trim()
        ? `Strukturiere folgende Antwort mit submit_trend_insight. viralScore, detectedNiche und keywords müssen exakt zum Inhalt von htmlOrMarkdownOutput passen:\n\n${draftAnswer.trim()}`
        : "Rufe submit_trend_insight auf, um deine Antwort für die Canvas-UI zu strukturieren.",
    },
  ];

  const turn = await runAnthropicAgentTurn(systemPrompt, structureMessages, {
    toolChoice: { type: "tool", name: SUBMIT_TREND_INSIGHT_TOOL },
  });

  if (!turn.ok) return null;

  const tool = turn.turn.toolUses.find(
    (t) => t.name === SUBMIT_TREND_INSIGHT_TOOL
  );
  if (!tool) return null;

  return normalizeAgentTrendInsight(tool.input);
}

async function* finishAgentRun(
  userMessage: string,
  finalSummary: string,
  outputs: AgentOutputs,
  totalCreditsUsed: number,
  lastCreditsLeft: number | undefined,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): AsyncGenerator<AgentStreamEvent> {
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
        await updateCreatorProfile(supabase, userId, partial);
      }
    }
  );
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
  let trendInsight: AgentTrendInsight | null = null;

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

    const turnHasInsightTool = turn.turn.toolUses.some(
      (tool) => tool.name === SUBMIT_TREND_INSIGHT_TOOL
    );

    if (turn.turn.text && !turnHasInsightTool) {
      const segment =
        finalSummary.length > 0 ? `\n\n${turn.turn.text}` : turn.turn.text;
      yield* emitTextChunks(segment);
      finalSummary += segment;
    }

    if (turn.turn.toolUses.length === 0) {
      if (!trendInsight && turn.turn.text.trim()) {
        const forced = await forceSubmitTrendInsight(
          systemPrompt,
          messages,
          turn.turn.text
        );
        if (forced) {
          trendInsight = forced;
          finalSummary = forced.htmlOrMarkdownOutput;
          yield* emitTrendInsight(forced);
        }
      }

      yield* finishAgentRun(
        userMessage,
        finalSummary,
        outputs,
        totalCreditsUsed,
        lastCreditsLeft,
        supabase,
        user.id
      );
      return;
    }

    messages.push({ role: "assistant", content: turn.turn.content });

    const toolResults: {
      type: "tool_result";
      tool_use_id: string;
      content: string;
    }[] = [];

    let insightSubmittedThisRound = false;

    for (const tool of turn.turn.toolUses) {
      if (tool.name === SUBMIT_TREND_INSIGHT_TOOL) {
        const insight = normalizeAgentTrendInsight(tool.input);
        if (!insight) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content: JSON.stringify({
              success: false,
              error: "Ungültiges submit_trend_insight JSON.",
            }),
          });
          continue;
        }

        trendInsight = insight;
        insightSubmittedThisRound = true;
        finalSummary = insight.htmlOrMarkdownOutput;

        yield {
          type: "tool_start",
          tool: SUBMIT_TREND_INSIGHT_TOOL,
          label: AGENT_META_TOOL_STEP_LABELS.submit_trend_insight,
        };
        yield* emitTrendInsight(insight);
        yield {
          type: "tool_done",
          tool: SUBMIT_TREND_INSIGHT_TOOL,
          creditsUsed: 0,
        };

        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: JSON.stringify({ success: true, data: insight }),
        });
        continue;
      }

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

    if (insightSubmittedThisRound && trendInsight) {
      yield* finishAgentRun(
        userMessage,
        finalSummary,
        outputs,
        totalCreditsUsed,
        lastCreditsLeft,
        supabase,
        user.id
      );
      return;
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

  if (!trendInsight && finalSummary.trim()) {
    const flowAppend = buildFlowSystemAppend(history, userMessage);
    const systemPrompt =
      MASTER_AGENT_SYSTEM_PROMPT + studioGuideBlock + flowAppend;
    const forced = await forceSubmitTrendInsight(
      systemPrompt,
      messages,
      finalSummary
    );
    if (forced) {
      trendInsight = forced;
      finalSummary = forced.htmlOrMarkdownOutput;
      yield* emitTrendInsight(forced);
    }
  }

  if (trendInsight) {
    yield* finishAgentRun(
      userMessage,
      finalSummary,
      outputs,
      totalCreditsUsed,
      lastCreditsLeft,
      supabase,
      user.id
    );
    return;
  }

  yield {
    type: "error",
    message: "Maximale Tool-Runden erreicht. Bitte erneut versuchen.",
  };
}
