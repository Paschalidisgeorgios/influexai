import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { getAnthropicConfigError, logAnthropicFailure, mapAnthropicSdkError } from "@/lib/anthropic";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import {
  buildLandingDemoUserPrompt,
  LANDING_DEMO_MODEL,
  LANDING_DEMO_SYSTEM_PROMPT,
  parseLandingDemoIdea,
} from "@/lib/claude-landing-demo";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 8;
const rateMap = new Map<string, { count: number; resetAt: number }>();

type DemoBody = {
  niche?: string;
  nische?: string;
  topic?: string;
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
  return mapAnthropicSdkError(err, LANDING_DEMO_MODEL);
}

export async function POST(request: Request) {
  let body: DemoBody;
  try {
    body = (await request.json()) as DemoBody;
  } catch {
    return NextResponse.json({ success: false, error: "Ungültiger Body." }, { status: 400 });
  }

  const niche = (body.niche ?? body.nische ?? body.topic ?? "").trim();
  if (niche.length < 2) {
    return NextResponse.json(
      { success: false, error: "Bitte gib eine Nische ein (mind. 2 Zeichen)." },
      { status: 400 }
    );
  }
  if (niche.length > 80) {
    return NextResponse.json(
      { success: false, error: "Nische ist zu lang (max. 80 Zeichen)." },
      { status: 400 }
    );
  }

  try {
    checkAgentInputSafety(niche);
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

  const rateKey = clientKey(request);
  if (!checkRateLimit(rateKey)) {
    return NextResponse.json(
      {
        success: false,
        error: "Demo-Limit erreicht. Registriere dich für unbegrenzte Generierungen.",
      },
      { status: 429 }
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!.trim() });

  try {
    const message = await anthropic.messages.create({
      model: LANDING_DEMO_MODEL,
      max_tokens: 180,
      temperature: 0.85,
      system: LANDING_DEMO_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildLandingDemoUserPrompt(niche) }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock?.type === "text" ? textBlock.text : "";
    if (!rawText.trim()) {
      throw new Error("Leere Antwort");
    }

    const idea = parseLandingDemoIdea(rawText);
    return NextResponse.json({ success: true, idea });
  } catch (err) {
    logAnthropicFailure("api/generate/demo", LANDING_DEMO_MODEL, err);
    const mapped = mapSdkError(err);
    return NextResponse.json({ success: false, error: mapped.message }, { status: mapped.status });
  }
}
