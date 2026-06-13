import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { getAnthropicConfigError, anthropicUserErrorFromStatus } from "@/lib/anthropic";
import {
  buildConciergeUserPrompt,
  CONCIERGE_MODEL,
  CONCIERGE_SYSTEM_PROMPT,
  parseConciergeResponse,
} from "@/lib/claude-concierge";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 12;
const rateMap = new Map<string, { count: number; resetAt: number }>();

type ConciergeBody = {
  question?: string;
  message?: string;
};

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count += 1;
  return true;
}

function mapSdkError(err: unknown): { status: number; message: string } {
  if (err instanceof Anthropic.APIError) {
    const message = anthropicUserErrorFromStatus(err.status, err.message);
    if (err.status === 429) return { status: 429, message };
    if (err.status === 401 || err.status === 403) return { status: 503, message };
    return { status: 502, message };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { status: 503, message: "Netzwerkfehler. Bitte erneut versuchen." };
  }
  if (err instanceof Error) {
    return { status: 502, message: "KI-Antwort konnte nicht verarbeitet werden." };
  }
  return { status: 500, message: "Unbekannter Fehler." };
}

export async function POST(request: Request) {
  let body: ConciergeBody;
  try {
    body = (await request.json()) as ConciergeBody;
  } catch {
    return NextResponse.json({ success: false, error: "Ungültiger Body." }, { status: 400 });
  }

  const question = (body.question ?? body.message ?? "").trim();
  if (question.length < 4) {
    return NextResponse.json(
      { success: false, error: "Bitte stelle eine konkretere Frage (mind. 4 Zeichen)." },
      { status: 400 }
    );
  }
  if (question.length > 400) {
    return NextResponse.json(
      { success: false, error: "Frage ist zu lang (max. 400 Zeichen)." },
      { status: 400 }
    );
  }

  const configError = getAnthropicConfigError();
  if (configError) {
    return NextResponse.json({ success: false, error: configError }, { status: 503 });
  }

  if (!checkRateLimit(`concierge:${clientKey(request)}`)) {
    return NextResponse.json(
      {
        success: false,
        error: "Concierge-Limit erreicht. Registriere dich für unbegrenzte Beratung.",
      },
      { status: 429 }
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!.trim() });

  try {
    const message = await anthropic.messages.create({
      model: CONCIERGE_MODEL,
      max_tokens: 320,
      temperature: 0.7,
      system: CONCIERGE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildConciergeUserPrompt(question) }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock?.type === "text" ? textBlock.text : "";
    if (!rawText.trim()) {
      throw new Error("Leere Antwort");
    }

    const payload = parseConciergeResponse(rawText);
    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    console.error("[api/generate/concierge]", err);
    const mapped = mapSdkError(err);
    return NextResponse.json({ success: false, error: mapped.message }, { status: mapped.status });
  }
}
