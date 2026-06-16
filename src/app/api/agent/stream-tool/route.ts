/**
 * POST /api/agent/stream-tool
 *
 * Thin Anthropic streaming proxy für Dashboard-Tool-Formulare.
 * Nimmt { tool, prompt } → streamt Claude-Antwort als SSE direkt durch.
 *
 * CREDITS: Pre-pay vor Anthropic-Stream (ORCHESTRATOR_BASE_COST oder Tool-Konstante).
 * Plan-Gate via assertKiToolAccess. Admin bypass via deductCredits/isCreditExemptUser.
 */

import { NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { ORCHESTRATOR_BASE_COST } from "@/lib/agent/credits";
import { addCredits, deductCredits } from "@/lib/credits";
import { CONTENT_KALENDER_TOOL_CREDIT_COST } from "@/lib/content-kalender-tool";
import {
  ANTHROPIC_MODEL,
  getAnthropicConfigError,
  anthropicUserErrorFromStatus,
} from "@/lib/anthropic";
import { TREND_SCRIPT_TOOL_CREDIT_COST } from "@/lib/trend-script-tool";
import { VIRAL_HOOK_EXTRACTOR_CREDIT_COST } from "@/lib/viral-hook-extraktor";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ---------------------------------------------------------------------------
// System Prompts per Tool
// ---------------------------------------------------------------------------

const SYSTEM_PROMPTS: Record<string, string> = {
  "viral-hook": `Du bist ein viraler Short-Form-Content-Stratege mit tiefem Verständnis für TikTok-, Reels- und Shorts-Algorithmen. 
Deine Hooks sind konkret, scroll-stoppend und sofort umsetzbar. 
Antworte immer auf Deutsch, strukturiert und nummeriert. Kein Intro, kein Outro — nur die Hooks.`,

  "content-calendar": `Du bist ein erfahrener Social Media Stratege. Du erstellst konkrete, realistische Content-Pläne.
Jeder Eintrag enthält: Wochentag, Format (Reel/Post/Story), konkreten Hook, optimale Uhrzeit.
Antworte auf Deutsch, strukturiert als Liste. Kein Intro, kein Outro.`,

  "trend-script": `Du bist ein professioneller Video-Skript-Texter für Short-Form Content.
Deine Skripte sind präzise, sprechbar und klar strukturiert: Hook → Kern → CTA.
Markiere Pausen mit [PAUSE], Schnitte mit [SCHNITT], Betonungen mit *Wort*.
Antworte auf Deutsch, direkt im Skript-Format. Kein Intro, kein Outro.`,
};

const DEFAULT_SYSTEM = `Du bist ein KI-Content-Assistent für Creator und Unternehmen.
Antworte präzise, strukturiert und auf Deutsch. Kein unnötiges Füllmaterial.`;

function creditCostForStreamTool(tool: string): number {
  switch (tool) {
    case "viral-hook":
      return VIRAL_HOOK_EXTRACTOR_CREDIT_COST;
    case "content-calendar":
      return CONTENT_KALENDER_TOOL_CREDIT_COST;
    case "trend-script":
      return TREND_SCRIPT_TOOL_CREDIT_COST;
    default:
      return ORCHESTRATOR_BASE_COST;
  }
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

type RequestBody = {
  tool?: string;
  prompt?: string;
};

export async function POST(request: Request) {
  const configError = getAnthropicConfigError();
  if (configError) {
    return Response.json({ error: configError }, { status: 503 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const tool = body.tool?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";

  if (!prompt || prompt.length < 5) {
    return Response.json({ error: "Prompt zu kurz." }, { status: 400 });
  }

  if (prompt.length > 10_000) {
    return Response.json({ error: "Prompt zu lang (max. 10.000 Zeichen)." }, { status: 400 });
  }

  const creditCost = creditCostForStreamTool(tool);
  const access = await assertKiToolAccess(creditCost);
  if (access instanceof NextResponse) return access;
  const { userId, supabase, isAdmin } = access;

  if (!isAdmin) {
    const deduction = await deductCredits(
      supabase,
      userId,
      creditCost,
      `Stream Tool — ${tool || "default"}`,
      {
        generationType: "agent-stream-tool",
        prompt: prompt.slice(0, 200),
      }
    );
    if (!deduction.success) {
      return Response.json(
        { error: deduction.error ?? "Nicht genug Credits." },
        { status: 402 }
      );
    }
  }

  const systemPrompt = SYSTEM_PROMPTS[tool] ?? DEFAULT_SYSTEM;
  const key = process.env.ANTHROPIC_API_KEY!.trim();

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    if (!isAdmin) {
      await addCredits(
        supabase,
        userId,
        creditCost,
        `Stream Tool — Refund`
      );
    }
    const errBody = await anthropicRes.text();
    const message = anthropicUserErrorFromStatus(anthropicRes.status, errBody);
    return Response.json({ error: message }, { status: 502 });
  }

  if (!anthropicRes.body) {
    if (!isAdmin) {
      await addCredits(
        supabase,
        userId,
        creditCost,
        `Stream Tool — Refund`
      );
    }
    return Response.json({ error: "Kein Stream erhalten." }, { status: 502 });
  }

  return new Response(anthropicRes.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
