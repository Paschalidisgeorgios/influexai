"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireKiToolAccessForAction } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import {
  e2eMockNiches,
  isE2eMockGenerationsEnabled,
} from "@/lib/e2e-mock-generations";
import {
  CLAUDE_JSON_SYSTEM_RULE,
  createAnthropicMessage,
  parseClaudeJson,
} from "@/lib/anthropic";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";

const CREDIT_COST = 2;

export type NicheIdea = {
  title: string;
  description: string;
  competition: "low" | "medium" | "high";
  potential: 1 | 2 | 3 | 4 | 5;
  trend: "rising" | "stable" | "declining";
  videoIdeas: [string, string, string];
};

type AnalyzeSuccess = {
  success: true;
  niches: NicheIdea[];
  creditsLeft: number;
};
type AnalyzeFailure = { success: false; error: string };
type SaveSuccess = { success: true };
type SaveFailure = { success: false; error: string };

function parseNiches(raw: string): NicheIdea[] {
  const parsed = parseClaudeJson<unknown>(raw);
  const wrapped = parsed as { niches?: unknown; data?: unknown } | unknown[];
  const list = Array.isArray(wrapped)
    ? wrapped
    : ((wrapped as { niches?: unknown }).niches ??
      (wrapped as { data?: unknown }).data);
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Ungültiges JSON-Format");
  }
  return list.slice(0, 5).map((item, i) => {
    const ideas = item.videoIdeas ?? item.video_ideas ?? [];
    const videoIdeas: [string, string, string] = [
      String(ideas[0] ?? `Video-Idee ${i + 1}a`),
      String(ideas[1] ?? `Video-Idee ${i + 1}b`),
      String(ideas[2] ?? `Video-Idee ${i + 1}c`),
    ];
    const comp = item.competition;
    const competition =
      comp === "low" || comp === "medium" || comp === "high" ? comp : "medium";
    const pot = Number(item.potential);
    const potential = Math.min(5, Math.max(1, pot || 3)) as 1 | 2 | 3 | 4 | 5;
    const tr = item.trend;
    const trend =
      tr === "rising" || tr === "stable" || tr === "declining" ? tr : "stable";
    return {
      title: String(item.title ?? `Nische ${i + 1}`),
      description: String(item.description ?? ""),
      competition,
      potential,
      trend,
      videoIdeas,
    };
  });
}

export async function analyzeNiche(
  topic: string,
  audience: string,
  format: string
): Promise<AnalyzeSuccess | AnalyzeFailure> {
  if (!topic?.trim()) {
    return { success: false, error: "Bitte gib ein Thema ein." };
  }

  try {
    checkAgentInputSafety(topic.trim());
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return { success: false, error: err.message };
    }
    throw err;
  }

  const access = await requireKiToolAccessForAction(CREDIT_COST);
  if (!access.ok) {
    if (access.credits !== undefined) {
      return insufficientCreditsError(access.credits, CREDIT_COST);
    }
    return { success: false, error: access.error };
  }
  const { userId, supabase } = access;

  if (isE2eMockGenerationsEnabled()) {
    const deduction = await deductCredits(
      supabase,
      userId,
      CREDIT_COST,
      "Niche Analyzer",
      { generationType: "niche-analyzer", prompt: topic.trim().slice(0, 200) }
    );
    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }
    return {
      success: true,
      niches: e2eMockNiches(topic.trim()),
      creditsLeft: deduction.remainingCredits,
    };
  }

  const systemPrompt = `Du bist ein YouTube Growth Experte. Analysiere das gegebene Thema und liefere exakt 5 profitable Nischen-Ideen als JSON-Array. ${CLAUDE_JSON_SYSTEM_RULE}`;

  const userPrompt = `Thema: ${topic.trim()}
Zielgruppe: ${audience}
Format: ${format}

Gib mir 5 profitable YouTube Nischen als JSON Array:
[{
  "title": string,
  "description": string,
  "competition": "low"|"medium"|"high",
  "potential": 1|2|3|4|5,
  "trend": "rising"|"stable"|"declining",
  "videoIdeas": [string, string, string]
}]`;

  try {
    const claude = await createAnthropicMessage({
      system: systemPrompt,
      user: userPrompt,
    });
    if (!claude.ok) {
      return { success: false, error: claude.error };
    }
    const text = claude.text;
    let niches: NicheIdea[];
    try {
      niches = parseNiches(text);
    } catch {
      console.error("Niche JSON parse failed:", text.slice(0, 500));
      return {
        success: false,
        error: "Antwort konnte nicht gelesen werden. Bitte erneut analysieren.",
      };
    }

    const deduction = await deductCredits(
      supabase,
      userId,
      CREDIT_COST,
      "Niche Analyzer",
      { generationType: "niche-analyzer", prompt: topic.trim() }
    );

    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }

    return { success: true, niches, creditsLeft: deduction.remainingCredits };
  } catch (e) {
    console.error("analyzeNiche:", e);
    return { success: false, error: "Unerwarteter Fehler bei der Analyse." };
  }
}

export async function saveNicheChoice(
  niche: NicheIdea
): Promise<SaveSuccess | SaveFailure> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Nicht eingeloggt." };
  }

  const { error } = await supabase.from("niche_saves").insert({
    user_id: user.id,
    niche_data: niche,
  });

  if (error) {
    console.error("saveNicheChoice:", error.message);
    if (error.code === "42P01") {
      return {
        success: false,
        error:
          "Speichern ist gerade nicht möglich. Bitte später erneut versuchen.",
      };
    }
    return { success: false, error: "Speichern fehlgeschlagen." };
  }

  return { success: true };
}
