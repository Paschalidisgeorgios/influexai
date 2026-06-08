import { NextResponse } from "next/server";

import { createAnthropicMessage, parseClaudeJson } from "@/lib/anthropic";
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
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { withPlanGuard } from "@/lib/guards/apiGuard";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

const KI_AGENT_CREDIT_COST = 1;

const SYSTEM_PROMPT = `Du bist der INFLUEXAI KI Agent — ein intelligenter 
Creator-Stratege, kein allgemeiner Chatbot.

Deine Aufgabe:
1. Erkenne den Intent des Nutzers (script_generation, ad_creation, 
   hook_generation, calendar_planning, thumbnail_creation, avatar_creation, unknown).
2. Wähle das passende Tool.
3. Wenn wichtige Infos fehlen: stelle maximal 1–2 gezielte Rückfragen.
4. Generiere einen strukturierten Output.
5. Schlage 2–3 sinnvolle nächste Aktionen vor.

WICHTIGE REGELN:
- Keine garantierten Finanz-, Steuer-, Gesundheits- oder Reichweitenversprechen.
- Keine automatischen Veröffentlichungen.
- Bei Avatar, Face, Voice: Consent-Hinweis in nextActions aufnehmen.
- RiskLevel "high" wenn der Content riskante Claims enthält.

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

function normalizeOutput(raw: unknown, fallbackText: string): AgentOutput {
  if (!raw || typeof raw !== "object") {
    return { type: "raw", text: fallbackText };
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
    return { type: "raw", text: String(o.text ?? fallbackText) };
  }

  return { type: "raw", text: fallbackText };
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

    return {
      intent,
      tool,
      missingInfo: Array.isArray(parsed.missingInfo)
        ? parsed.missingInfo.map(String)
        : [],
      summary: String(parsed.summary ?? ""),
      output,
      scores: mergeScores(parsed.scores, output, platform),
      nextActions,
    };
  } catch {
    const output: AgentOutput = { type: "raw", text: rawText };
    return {
      intent: "unknown",
      tool: null,
      missingInfo: [],
      summary: "Antwort konnte nicht strukturiert werden.",
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

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const guardError = await withPlanGuard(user.id);
  if (guardError) return guardError;

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    KI_AGENT_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Nicht genug Credits.",
        credits: creditCheck.credits,
        required: KI_AGENT_CREDIT_COST,
      },
      { status: 402 }
    );
  }

  const platform = resolvePlatform(body.creatorDNA);
  const userPrompt = buildUserPrompt(messages, body.creatorDNA);

  const claude = await createAnthropicMessage({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 4096,
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
    user.id,
    KI_AGENT_CREDIT_COST,
    "KI Agent",
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
    user_id: user.id,
    type: "ki-agent",
    prompt: promptSummary,
    credits_used: KI_AGENT_CREDIT_COST,
    result: agentResponse,
  });

  if (genErr) {
    console.error("[ki-agent] generations insert:", genErr.message);
  }

  return NextResponse.json({
    success: true,
    agentResponse,
    creditsUsed: KI_AGENT_CREDIT_COST,
    creditsLeft: deducted.remainingCredits,
  });
}
