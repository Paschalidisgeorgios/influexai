/**
 * POST /api/agent/stream-tool
 *
 * Thin Anthropic streaming proxy für Dashboard-Tool-Formulare.
 * Nimmt { tool, prompt } → streamt Claude-Antwort als SSE direkt durch.
 *
 * CREDITS: Diese Route deducts keine Credits — das passiert bereits
 * in den spezifischen Tool-Routen (/api/viral-hook etc.).
 * Hier geht es nur um echtes Token-by-Token Streaming.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ANTHROPIC_MODEL,
  getAnthropicConfigError,
  anthropicUserErrorFromStatus,
} from "@/lib/anthropic";

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

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

type RequestBody = {
  tool?: string;
  prompt?: string;
};

export async function POST(request: Request) {
  // Auth
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  // Config check
  const configError = getAnthropicConfigError();
  if (configError) {
    return Response.json({ error: configError }, { status: 503 });
  }

  // Body
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

  const systemPrompt = SYSTEM_PROMPTS[tool] ?? DEFAULT_SYSTEM;
  const key = process.env.ANTHROPIC_API_KEY!.trim();

  // Anthropic Streaming Request
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
    const errBody = await anthropicRes.text();
    const message = anthropicUserErrorFromStatus(anthropicRes.status, errBody);
    return Response.json({ error: message }, { status: 502 });
  }

  if (!anthropicRes.body) {
    return Response.json({ error: "Kein Stream erhalten." }, { status: 502 });
  }

  // Passthrough — Anthropic SSE direkt an den Client durchleiten
  return new Response(anthropicRes.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
