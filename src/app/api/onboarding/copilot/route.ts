import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import {
  ANTHROPIC_EPHEMERAL_CACHE_CONTROL,
  getAnthropicConfigError,
  logAnthropicFailure,
  mapAnthropicSdkError,
} from "@/lib/anthropic";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import {
  buildOnboardingUserPrompt,
  ONBOARDING_COPILOT_MODEL,
  ONBOARDING_SYSTEM_PROMPT,
  parseOnboardingCopilotResponse,
} from "@/lib/canvas/onboarding-copilot";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type CopilotBody = {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  canvasContext?: { toolsOnCanvas?: string[]; lastAction?: string };
};

function mapSdkError(err: unknown): { status: number; message: string } {
  return mapAnthropicSdkError(err, ONBOARDING_COPILOT_MODEL);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Bitte anmelden, um den Co-Pilot zu nutzen." },
      { status: 401 }
    );
  }

  let body: CopilotBody;
  try {
    body = (await request.json()) as CopilotBody;
  } catch {
    return NextResponse.json({ success: false, error: "Ungültiger Body." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (message.length < 2) {
    return NextResponse.json(
      { success: false, error: "Bitte stelle eine konkretere Frage." },
      { status: 400 }
    );
  }
  if (message.length > 500) {
    return NextResponse.json(
      { success: false, error: "Nachricht ist zu lang (max. 500 Zeichen)." },
      { status: 400 }
    );
  }

  try {
    checkAgentInputSafety(message);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    throw err;
  }

  const configError = getAnthropicConfigError();
  if (configError) {
    return NextResponse.json({ success: false, error: configError }, { status: 503 });
  }

  const history = (body.history ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(0, 600),
    }));

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!.trim() });

  try {
    const userContent = buildOnboardingUserPrompt(message, body.canvasContext);
    const apiMessages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent },
    ];

    const response = await anthropic.messages.create({
      model: ONBOARDING_COPILOT_MODEL,
      max_tokens: 280,
      temperature: 0.55,
      system: ONBOARDING_SYSTEM_PROMPT,
      messages: apiMessages,
      cache_control: ANTHROPIC_EPHEMERAL_CACHE_CONTROL,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const rawText = textBlock?.type === "text" ? textBlock.text : "";
    if (!rawText.trim()) {
      throw new Error("Leere Antwort");
    }

    const payload = parseOnboardingCopilotResponse(rawText);
    return NextResponse.json({
      success: true,
      answer: payload.answer,
      highlightTool: payload.highlightTool,
    });
  } catch (err) {
    logAnthropicFailure("api/onboarding/copilot", ONBOARDING_COPILOT_MODEL, err);
    const mapped = mapSdkError(err);
    return NextResponse.json({ success: false, error: mapped.message }, { status: mapped.status });
  }
}
