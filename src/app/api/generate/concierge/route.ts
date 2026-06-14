import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { getAnthropicConfigError, logAnthropicFailure, mapAnthropicSdkError } from "@/lib/anthropic";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import {
  buildConciergeUserPrompt,
  CONCIERGE_MODEL,
  CONCIERGE_SYSTEM_PROMPT,
  parseConciergeResponse,
} from "@/lib/claude-concierge";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 12;
const rateMap = new Map<string, { count: number; resetAt: number }>();

type ConciergeBody = {
  question?: string;
  message?: string;
  turnstileToken?: string;
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
  return mapAnthropicSdkError(err, CONCIERGE_MODEL);
}

export async function POST(request: Request) {
  let body: ConciergeBody;
  try {
    body = (await request.json()) as ConciergeBody;
  } catch {
    return NextResponse.json({ success: false, error: "Ungültiger Body." }, { status: 400 });
  }

  const turnstileToken = body.turnstileToken;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  const turnstileValid = await verifyTurnstileToken(turnstileToken, ip);
  if (!turnstileValid) {
    return NextResponse.json(
      {
        success: false,
        error: "Sicherheitsprüfung fehlgeschlagen. Bitte Seite neu laden.",
      },
      { status: 403 }
    );
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

  try {
    checkAgentInputSafety(question);
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
    logAnthropicFailure("api/generate/concierge", CONCIERGE_MODEL, err);
    const mapped = mapSdkError(err);
    return NextResponse.json({ success: false, error: mapped.message }, { status: mapped.status });
  }
}
