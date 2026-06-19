/**
 * /api/agent/copilot
 *
 * Leichtgewichtige SSE-Route für den InfluexAI-Copiloten.
 * Kein Tool-Calling, kein Master-Agent-Overhead.
 * Gibt text_delta SSE-Events zurück — kompatibel mit dem AgentBox-Consumer.
 *
 * Besonderheit: Claude antwortet ggf. mit [[NAVIGATE:tool-id]] am Ende
 * des Streams. Die AgentBox parst dieses Marker und triggert die Navigation.
 */

import { NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { ORCHESTRATOR_BASE_COST } from "@/lib/agent/credits";
import { addCredits, deductCredits } from "@/lib/credits";
import {
  getAnthropicConfigError,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic   = "force-dynamic";
export const maxDuration = 60;

// ─── System-Prompt ────────────────────────────────────────────────────────────

const INFLUEXAI_COPILOT_SYSTEM = `\
Du bist der offizielle InfluexAI Copilot. Du hilfst Nutzern, das Beste aus der InfluexAI KI-Plattform herauszuholen. Antworte immer auf Deutsch, präzise und freundlich — maximal 3 kurze Absätze, kein unnötiges Intro.

PLATFORM-WISSEN:
• InfluexAI bietet erstklassige Video-Tools (Kling 3.0 Pro für 4K-Videos, Text-zu-Video, Face-Swap, Character-Swap, Avatar-Video, Sprechendes Foto) und Bild-Tools (Nano Banana Pro für photorealistische Bilder, Nano Banana 2 für Speed, Flux 2 Pro für Premium-Qualität) sowie Marketing-Tools (Viral Hook Generator, Content-Kalender, Trend-Script-Generator).

CREDITS-SYSTEM:
• Text-Tools (Viral Hook, Content-Kalender, Trend-Script): immer 1 Credit
• Bilder mit Nano Banana 2: 3 Credits | Nano Banana Pro: 5 Credits | Flux 2 Pro: 3 Credits
• Videos Kling 3.0 (5 Sek.): 15 Credits | Kling 3.0 (10 Sek.): 30 Credits
• Akool-Tools (Face-Swap, Avatar): pauschal 10 Credits
• Audio (TTS, Voice-Clone): 2 Credits

NAVIGATION-BEFEHLE (WICHTIG):
Wenn der Nutzer zu einem Tool navigieren möchte oder danach fragt, antworte kurz und hänge EXAKT am Ende deiner Antwort, nach einem Zeilenumbruch, diesen Marker an — ohne Erklärung, ohne Anführungszeichen:
[[NAVIGATE:tool-id]]

Verfügbare Tool-IDs für Navigation:
• image-gen | img-to-img | img-to-video | text-to-video | video-to-video | ref-to-video
• face-swap-video | face-swap-image | character-swap | char-studio-video | char-studio-image
• avatar-video | video-translation | talking-avatar | talking-photo | ai-video-editor
• ecommerce-ads | tts | voice-clone | voice-changer | live-camera | streaming-avatar
• live-face-swap | ai-support-agent | akool-production | holographic-avatar | akool-edge
• viral-hook | content-calendar | trend-script | gallery | settings | jarvis-moderator

Wenn keine eindeutige Navigation nötig ist, füge KEINEN [[NAVIGATE:...]] Marker ein.

BEISPIELE:
Nutzer: "Ich möchte ein Bild generieren"
Du: "Ich öffne den Bild-Generator für dich! Mit Nano Banana Pro erhältst du photorealistische Qualität in Sekunden."
[[NAVIGATE:image-gen]]

Nutzer: "Zeig mir meine Galerie"
Du: "Hier ist deine Galerie mit all deinen generierten Assets."
[[NAVIGATE:gallery]]

Nutzer: "Was kostet ein Kling-Video?"
Du: [Antworte ohne Navigation-Marker, nur Information]
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

type RequestBody = {
  message: string;
  history?: CopilotMessage[];
};

// ─── SSE Helpers ─────────────────────────────────────────────────────────────

function sse(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

// ─── Anthropic Streaming ──────────────────────────────────────────────────────

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

async function* streamAnthropicText(
  system: string,
  messages: CopilotMessage[]
): AsyncGenerator<string | { error: string }> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    yield { error: "ANTHROPIC_API_KEY nicht konfiguriert." };
    return;
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key":         key,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      SCRIPT_GENERATOR_MODEL,
      max_tokens: 1024,
      stream:     true,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    yield { error: `Anthropic ${res.status}: ${text.slice(0, 200)}` };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) { yield { error: "Kein Response-Body." }; return; }

  const dec    = new TextDecoder();
  let buffer   = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += dec.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;

      let evt: Record<string, unknown>;
      try { evt = JSON.parse(raw) as Record<string, unknown>; }
      catch { continue; }

      if (evt.type === "content_block_delta") {
        const delta = evt.delta as Record<string, unknown> | undefined;
        if (delta?.type === "text_delta" && typeof delta.text === "string") {
          yield delta.text;
        }
      }
    }
  }
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  const configErr = getAnthropicConfigError();
  if (configErr) {
    return Response.json({ error: configErr }, { status: 503 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return Response.json({ error: "Nachricht fehlt." }, { status: 400 });
  }

  const access = await assertKiToolAccess(ORCHESTRATOR_BASE_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase, isAdmin } = access;

  let creditsCharged = false;
  if (!isAdmin) {
    const deduction = await deductCredits(
      supabase,
      userId,
      ORCHESTRATOR_BASE_COST,
      "Copilot",
      {
        generationType: "agent-copilot",
        prompt: message.slice(0, 200),
      }
    );
    if (!deduction.success) {
      return Response.json(
        { error: deduction.error ?? "Nicht genug Credits." },
        { status: 402 }
      );
    }
    creditsCharged = true;
  }

  const history: CopilotMessage[] = Array.isArray(body.history)
    ? body.history.slice(-10)   // max 10 Nachrichten Kontext
    : [];

  const messages: CopilotMessage[] = [
    ...history,
    { role: "user", content: message },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      let streamFailed = false;
      try {
        for await (const chunk of streamAnthropicText(INFLUEXAI_COPILOT_SYSTEM, messages)) {
          if (typeof chunk === "string") {
            controller.enqueue(sse({ type: "text_delta", text: chunk }));
          } else {
            streamFailed = true;
            controller.enqueue(sse({ type: "error", message: chunk.error }));
          }
        }
        if (!streamFailed) {
          controller.enqueue(sse({ type: "done" }));
        }
      } catch (err) {
        streamFailed = true;
        console.error("[copilot] stream error:", err);
        controller.enqueue(sse({ type: "error", message: "Copilot-Fehler. Bitte erneut versuchen." }));
      } finally {
        if (creditsCharged && streamFailed) {
          await addCredits(
            supabase,
            userId,
            ORCHESTRATOR_BASE_COST,
            "Copilot — Refund"
          );
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
    },
  });
}
