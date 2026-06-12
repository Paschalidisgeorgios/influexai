import { NextResponse } from "next/server";

import {
  createAnthropicMessage,
  parseClaudeJson,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";
import { scoreOutput } from "@/lib/agent-scoring";
import type {
  AgentIntent,
  AgentOutput,
  AgentResponse,
  AgentScores,
  AgentTool,
  ChatMessage,
  CreatorDNA,
  NextAction,
} from "@/lib/agent-types";
import { assertKiToolAccess } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import {
  extractCreatorFactsFromChat,
  formatCreatorProfileForPrompt,
  getCreatorProfile,
  updateCreatorProfile,
} from "@/lib/agent/creatorMemory";
import {
  STUDIO_GUIDE_INSTRUCTIONS,
  STUDIO_KNOWLEDGE,
} from "@/lib/agent/studioKnowledge";
import { detectIntent } from "@/lib/agent/router";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

const KI_AGENT_CREDIT_COST = 1;

const SYSTEM_PROMPT = `Du bist AGENT AUTOPILOT — der intelligente Content-Stratege von InfluexAI.

CREATOR PROFIL:
{creatorDNA injected here}

DEINE AUFGABEN:
- Virale Hooks, Skripte und Content erstellen
- Kampagnen und Strategien entwickeln
- Content analysieren und verbessern
- Trends für die Nische des Creators identifizieren

REGELN:
- Antworte IMMER auf Deutsch
- Sei konkret und actionable — kein Fülltext
- Erstelle Content der sofort verwendbar ist
- Formatiere Hooks als nummerierte Liste
- Beende jede Antwort mit einem konkreten nächsten Schritt
- Du heißt AGENT AUTOPILOT, nicht KI Agent oder Claude
- Keine garantierten Finanz-, Steuer-, Gesundheits- oder Reichweitenversprechen
- Keine automatischen Veröffentlichungen

Antworte AUSSCHLIESSLICH als valides JSON ohne Markdown-Backticks:
{
  "intent": "...",
  "tool": "...",
  "missingInfo": [],
  "summary": "...",
  "output": { ... },
  "scores": {
    "hookScore": 0,
    "clarity": 0,
    "platformFit": "medium",
    "trendFit": "medium",
    "ctaStrength": 0,
    "riskLevel": "low"
  },
  "nextActions": []
}`;

function buildKiAgentSystemPrompt(creatorContext: string): string {
  const base = SYSTEM_PROMPT.replace(
    "{creatorDNA injected here}",
    creatorContext || "Noch kein Creator-Profil hinterlegt."
  );
  return `${base}

${STUDIO_GUIDE_INSTRUCTIONS}

${STUDIO_KNOWLEDGE}`;
}

type RequestBody = {
  messages?: ChatMessage[];
  creatorDNA?: CreatorDNA;
};

const VALID_INTENTS: AgentIntent[] = [
  "script_generation",
  "ad_creation",
  "hook_generation",
  "calendar_planning",
  "thumbnail_creation",
  "avatar_creation",
  "unknown",
];

const VALID_TOOLS: AgentTool[] = [
  "script_generator",
  "produkt_werbung",
  "viral_hook_extraktor",
  "content_kalender",
  "thumbnail_konzept",
  "mein_ki_ich",
];

const VALID_NEXT_ACTIONS: NextAction[] = [
  "thumbnail_erstellen",
  "caption_schreiben",
  "hook_variieren",
  "in_kalender_uebernehmen",
  "mehr_varianten",
  "speichern",
];

function defaultScores(): AgentScores {
  return {
    hookScore: 50,
    clarity: 50,
    platformFit: "medium",
    trendFit: "medium",
    ctaStrength: 50,
    riskLevel: "low",
  };
}

function resolvePlatform(creatorDNA?: CreatorDNA): string {
  if (creatorDNA?.platforms?.length) {
    return creatorDNA.platforms.join(", ");
  }
  return "TikTok";
}

function buildUserPrompt(messages: ChatMessage[], creatorDNA?: CreatorDNA): string {
  const parts: string[] = [];

  if (creatorDNA) {
    parts.push(`Creator-DNA:\n${JSON.stringify(creatorDNA, null, 2)}`);
  }

  if (messages.length > 0) {
    parts.push("Konversationsverlauf:");
    for (const message of messages.slice(-20)) {
      const label = message.role === "user" ? "Nutzer" : "Assistent";
      parts.push(`${label}: ${message.content}`);
    }
  }

  return parts.join("\n\n");
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function readStringField(
  obj: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function formatLooseOutputObject(raw: Record<string, unknown>): string {
  const parts: string[] = [];

  const hook = readStringField(raw, "hook");
  const story = readStringField(raw, "story", "body", "content", "text");
  const cta = readStringField(raw, "cta");
  if (hook) parts.push(hook);
  if (story && story !== hook) parts.push(story);
  if (cta) parts.push(cta);

  if (Array.isArray(raw.variants)) {
    parts.push(
      raw.variants
        .map((variant, index) => `${index + 1}. ${String(variant)}`)
        .join("\n")
    );
  }

  if (Array.isArray(raw.hashtags)) {
    const tags = raw.hashtags
      .map((tag) => String(tag))
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
    if (tags) parts.push(tags);
  }

  return parts.filter(Boolean).join("\n\n");
}

function extractHumanReadableText(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return "";

  if (!looksLikeJson(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = parseClaudeJson<Record<string, unknown>>(trimmed);
    const summary = readStringField(parsed, "summary", "message", "response", "text");
    if (summary && !looksLikeJson(summary)) {
      return summary;
    }

    const output = parsed.output;
    if (typeof output === "string" && output.trim() && !looksLikeJson(output)) {
      return output.trim();
    }
    if (output && typeof output === "object") {
      const formatted = formatLooseOutputObject(output as Record<string, unknown>);
      if (formatted) return formatted;
      const outputText = readStringField(
        output as Record<string, unknown>,
        "text",
        "message",
        "content",
        "response"
      );
      if (outputText && !looksLikeJson(outputText)) {
        return outputText;
      }
    }

    const direct = readStringField(parsed, "message", "response", "text", "content");
    if (direct && !looksLikeJson(direct)) {
      return direct;
    }
  } catch {
    const proseEnd = trimmed.search(/[[{]/);
    if (proseEnd > 0) {
      const prose = trimmed.slice(0, proseEnd).trim();
      if (prose) return prose;
    }
  }

  return looksLikeJson(trimmed) ? "" : trimmed;
}

function normalizeOutput(raw: unknown, fallbackText: string): AgentOutput {
  const readableFallback = extractHumanReadableText(fallbackText);

  if (typeof raw === "string") {
    const text = extractHumanReadableText(raw);
    return { type: "raw", text: text || readableFallback };
  }

  if (!raw || typeof raw !== "object") {
    return { type: "raw", text: readableFallback };
  }

  const o = raw as Record<string, unknown>;

  if (o.type === "script") {
    return {
      type: "script",
      hook: String(o.hook ?? ""),
      story: String(o.story ?? ""),
      cta: String(o.cta ?? ""),
      hashtags: Array.isArray(o.hashtags)
        ? o.hashtags.map((h) => String(h))
        : [],
    };
  }

  if (o.type === "hooks") {
    return {
      type: "hooks",
      variants: Array.isArray(o.variants)
        ? o.variants.map((v) => String(v))
        : [],
    };
  }

  if (o.type === "calendar") {
    return {
      type: "calendar",
      entries: Array.isArray(o.entries)
        ? o.entries.map((entry) => {
            const e = entry as Record<string, unknown>;
            return {
              day: String(e.day ?? ""),
              idea: String(e.idea ?? ""),
              format: String(e.format ?? ""),
            };
          })
        : [],
      bestTime: String(o.bestTime ?? ""),
    };
  }

  if (o.type === "ad") {
    return {
      type: "ad",
      hook: String(o.hook ?? ""),
      body: String(o.body ?? ""),
      hashtags: Array.isArray(o.hashtags)
        ? o.hashtags.map((h) => String(h))
        : [],
    };
  }

  if (o.type === "raw") {
    const text = readStringField(o, "text");
    return { type: "raw", text: text || readableFallback };
  }

  const loose = formatLooseOutputObject(o);
  if (loose) {
    return { type: "raw", text: loose };
  }

  const direct = readStringField(o, "text", "message", "content", "response");
  return { type: "raw", text: direct || readableFallback };
}

function mergeScores(
  llmScores: Partial<AgentScores> | undefined,
  output: AgentOutput,
  platform: string
): AgentScores {
  const heuristic = scoreOutput(output, platform);
  const riskLevel: AgentScores["riskLevel"] =
    llmScores?.riskLevel === "high" || heuristic.riskLevel === "high"
      ? "high"
      : llmScores?.riskLevel === "medium" || heuristic.riskLevel === "medium"
        ? "medium"
        : "low";

  return {
    hookScore: heuristic.hookScore,
    clarity: heuristic.clarity,
    platformFit: heuristic.platformFit,
    trendFit: heuristic.trendFit,
    ctaStrength: heuristic.ctaStrength,
    riskLevel,
  };
}

function parseAgentResponse(
  rawText: string,
  platform: string
): AgentResponse {
  try {
    const parsed = parseClaudeJson<Partial<AgentResponse>>(rawText);
    const output = normalizeOutput(parsed.output, rawText);
    const intent = VALID_INTENTS.includes(parsed.intent as AgentIntent)
      ? (parsed.intent as AgentIntent)
      : "unknown";
    const tool =
      parsed.tool && VALID_TOOLS.includes(parsed.tool as AgentTool)
        ? (parsed.tool as AgentTool)
        : null;
    const nextActions = Array.isArray(parsed.nextActions)
      ? parsed.nextActions.filter((a): a is NextAction =>
          VALID_NEXT_ACTIONS.includes(a as NextAction)
        )
      : [];

    const summary = readStringField(
      parsed as Record<string, unknown>,
      "summary"
    );
    const safeOutput: AgentOutput =
      output.type === "raw" && looksLikeJson(output.text)
        ? { type: "raw", text: extractHumanReadableText(rawText) }
        : output;

    return {
      intent,
      tool,
      missingInfo: Array.isArray(parsed.missingInfo)
        ? parsed.missingInfo.map(String)
        : [],
      summary: summary && !looksLikeJson(summary) ? summary : "",
      output: safeOutput,
      scores: mergeScores(parsed.scores, safeOutput, platform),
      nextActions,
    };
  } catch {
    const humanText = extractHumanReadableText(rawText);
    const output: AgentOutput = { type: "raw", text: humanText };
    return {
      intent: "unknown",
      tool: null,
      missingInfo: [],
      summary: "",
      output,
      scores: mergeScores(defaultScores(), output, platform),
      nextActions: [],
    };
  }
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return NextResponse.json(
      { success: false, error: "Mindestens eine Nutzer-Nachricht erforderlich." },
      { status: 400 }
    );
  }

  const access = await assertKiToolAccess(KI_AGENT_CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const dbProfile = await getCreatorProfile(supabase, userId);
  const creatorContext = formatCreatorProfileForPrompt(dbProfile);
  const platform =
    dbProfile?.plattformen?.join(", ") ??
    resolvePlatform(body.creatorDNA);
  const userPrompt = buildUserPrompt(messages, body.creatorDNA);
  const lastUserContent = lastUser.content.trim();
  const detectedIntent = detectIntent(lastUserContent);

  const claude = await createAnthropicMessage({
    system:
      buildKiAgentSystemPrompt(creatorContext) +
      `\n\nErkannter Intent (Heuristik): ${detectedIntent}`,
    user: userPrompt,
    maxTokens: 4096,
    model: SCRIPT_GENERATOR_MODEL,
  });

  if (!claude.ok) {
    return NextResponse.json(
      { success: false, error: claude.error },
      { status: 503 }
    );
  }

  const agentResponse = parseAgentResponse(claude.text, platform);
  const promptSummary = lastUser.content.trim().slice(0, 200);

  const deducted = await deductCredits(
    supabase,
    userId,
    KI_AGENT_CREDIT_COST,
    "Agent Autopilot",
    {
      generationType: "ki-agent",
      skipGenerationLog: true,
      prompt: promptSummary,
    }
  );

  if (!deducted.success) {
    const status = deducted.error === "Nicht genug Credits." ? 402 : 500;
    return NextResponse.json(
      {
        success: false,
        error: deducted.error ?? "Credits konnten nicht abgezogen werden.",
        credits: deducted.remainingCredits,
        required: KI_AGENT_CREDIT_COST,
      },
      { status }
    );
  }

  const { error: genErr } = await supabase.from("generations").insert({
    user_id: userId,
    type: "ki-agent",
    prompt: promptSummary,
    credits_used: KI_AGENT_CREDIT_COST,
    result: agentResponse,
  });

  if (genErr) {
    console.error("[ki-agent] generations insert:", genErr.message);
  }

  void extractCreatorFactsFromChat(
    lastUser.content,
    agentResponse.summary || JSON.stringify(agentResponse.output)
  ).then(async (partial) => {
    if (Object.keys(partial).length > 0) {
      await updateCreatorProfile(supabase, userId, partial);
    }
  });

  return NextResponse.json({
    success: true,
    agentResponse,
    creditsUsed: KI_AGENT_CREDIT_COST,
    creditsLeft: deducted.remainingCredits,
  });
}
