import "server-only";

import { createAnthropicMessage, CLAUDE_JSON_SYSTEM_RULE } from "@/lib/anthropic";

export const INTENT_ROUTER_MODEL = "claude-sonnet-4-5-20250929";

export type IntentToolId =
  | "image-generator"
  | "ki-influencer"
  | "ugc-video"
  | "script-generator"
  | "viral-hooks"
  | "content-kalender"
  | "trend-script"
  | "product-ad"
  | "thumbnail"
  | "ki-agent";

export type IntentRouteResult = {
  tool: IntentToolId;
  prefill: Record<string, string>;
  confidence: number;
};

const VALID_TOOLS = new Set<string>([
  "image-generator",
  "ki-influencer",
  "ugc-video",
  "script-generator",
  "viral-hooks",
  "content-kalender",
  "trend-script",
  "product-ad",
  "thumbnail",
  "ki-agent",
]);

const SYSTEM_PROMPT = `${CLAUDE_JSON_SYSTEM_RULE}

Du bist ein Intent-Router für InfluexAI. Klassifiziere die deutsche Nutzereingabe in genau EIN Tool und extrahiere relevante Parameter.

Tools und mögliche prefill-Felder:
- image-generator: { "prompt": string, "styleId"?: "authentic"|"editorial"|"cinematic"|"product" }
- ki-influencer: {}
- ugc-video: { "produkt"?: string }
- script-generator: { "thema": string, "plattform"?: string }
- viral-hooks: { "input": string }
- content-kalender: { "nische"?: string, "plattform"?: string }
- trend-script: { "thema"?: string }
- product-ad: { "produkt"?: string }
- thumbnail: { "thema"?: string }
- ki-agent: {} (Fallback für komplexe oder mehrstufige Ziele)

Antwortformat (NUR JSON, keine Erklärung):
{"tool":"<tool-id>","prefill":{...},"confidence":0.0}

confidence: 0.0–1.0 — wie sicher die Zuordnung ist. Bei Mehrdeutigkeit oder komplexen Workflows: ki-agent mit niedriger confidence.`;

function fallbackResult(): IntentRouteResult {
  return { tool: "ki-agent", prefill: {}, confidence: 0 };
}

function parseIntentResponse(raw: string): IntentRouteResult {
  try {
    const parsed = JSON.parse(raw) as {
      tool?: string;
      prefill?: Record<string, unknown>;
      confidence?: number;
    };
    const tool = parsed.tool ?? "ki-agent";
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0;

    if (!VALID_TOOLS.has(tool)) {
      return fallbackResult();
    }

    const prefill: Record<string, string> = {};
    if (parsed.prefill && typeof parsed.prefill === "object") {
      for (const [key, value] of Object.entries(parsed.prefill)) {
        if (typeof value === "string" && value.trim()) {
          prefill[key] = value.trim();
        }
      }
    }

    return {
      tool: tool as IntentToolId,
      prefill,
      confidence,
    };
  } catch {
    return fallbackResult();
  }
}

export async function routeIntent(
  userInput: string
): Promise<IntentRouteResult> {
  const trimmed = userInput.trim();
  if (!trimmed) {
    return fallbackResult();
  }

  const result = await createAnthropicMessage({
    model: INTENT_ROUTER_MODEL,
    maxTokens: 300,
    system: SYSTEM_PROMPT,
    user: trimmed,
  });

  if (!result.ok) {
    console.error("[intent-router] Claude error:", result.error);
    return fallbackResult();
  }

  return parseIntentResponse(result.text);
}
