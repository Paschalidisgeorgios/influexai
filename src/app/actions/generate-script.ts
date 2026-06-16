"use server";

import { getLocale } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireKiToolAccessForAction } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import { localeToPromptLanguage, type Locale } from "@/lib/locale";
import {
  e2eMockScript,
  isE2eMockGenerationsEnabled,
} from "@/lib/e2e-mock-generations";
import {
  CLAUDE_JSON_SYSTEM_RULE,
  createAnthropicMessage,
  parseClaudeJson,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";

const GENERATE_COST = 2;
const REGENERATE_COST = 1;

export type ScriptSettings = {
  duration: string;
  tone: string;
  language: string;
  hookVariants: boolean;
  bRoll: boolean;
};

export type GeneratedScript = {
  script: string;
  hookVariants: string[];
  wordCount: number;
  estimatedSeconds: number;
  toneDescription: string;
};

export type GenerateScriptInput = {
  topic: string;
  duration: string;
  tone: string;
  language: string;
  hookVariants: boolean;
  bRoll: boolean;
};

type GenerateSuccess = {
  success: true;
  result: GeneratedScript;
  creditsLeft: number;
};

type GenerateFailure = {
  success: false;
  error: string;
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseScriptResponse(
  raw: string,
  hookVariantsRequested: boolean
): GeneratedScript {
  let parsed: Record<string, unknown>;
  try {
    parsed = parseClaudeJson<Record<string, unknown>>(raw);
  } catch (parseErr) {
    console.error("parseScriptResponse JSON:", parseErr, raw.slice(0, 400));
    throw new Error(
      "KI-Antwort konnte nicht gelesen werden. Bitte erneut versuchen."
    );
  }

  const data =
    parsed?.script !== undefined
      ? parsed
      : ((parsed?.data as Record<string, unknown>) ?? parsed);

  const script = String(data.script ?? "");
  if (!script.trim()) throw new Error("Leeres Script");

  let hookVariants: string[] = [];
  const variants = data.hookVariants ?? data.hook_variants ?? [];
  if (hookVariantsRequested && Array.isArray(variants)) {
    hookVariants = variants.slice(0, 3).map((h: unknown) => String(h));
  }

  const wordCount =
    Number(data.wordCount ?? data.word_count) || countWords(script);
  const estimatedSeconds =
    Number(data.estimatedSeconds ?? data.estimated_seconds) ||
    Math.round(wordCount / 2.5);

  return {
    script,
    hookVariants,
    wordCount,
    estimatedSeconds,
    toneDescription: String(
      data.toneDescription ??
        data.tone_description ??
        "Script im gewählten Stil."
    ),
  };
}

async function callClaude(
  topic: string,
  duration: string,
  tone: string,
  language: string,
  bRoll: boolean,
  hookVariants: boolean,
  locale: Locale
): Promise<string> {
  const outputLanguage = localeToPromptLanguage[locale] ?? "German";
  const systemPrompt = `Du bist ein professioneller Short-Form Video Script Writer. Nutze psychologische Trigger, Struktur: Hook → Value/Story → CTA. Tags: [HOOK], [MAIN], [CTA]. Antworte auf ${outputLanguage}. ${CLAUDE_JSON_SYSTEM_RULE}`;

  const userPrompt = `Thema: ${topic}
Länge: ${duration}
Stil: ${tone}
Sprache: ${language}
B-Roll Hints: ${bRoll ? "ja — nutze [B-ROLL: Beschreibung] Marker im Script" : "nein"}

${hookVariants ? "Generiere zusätzlich 3 alternative Hook-Varianten in hookVariants." : "hookVariants: leeres Array []"}

Erstelle ein Video-Script.

JSON:
{
  "script": string,
  "hookVariants": [string, string, string],
  "wordCount": number,
  "estimatedSeconds": number,
  "toneDescription": string
}`;

  const claude = await createAnthropicMessage({
    system: systemPrompt,
    user: userPrompt,
    model: SCRIPT_GENERATOR_MODEL,
  });
  if (!claude.ok) {
    throw new Error(claude.error);
  }
  return claude.text;
}

export async function generateScript(
  input: GenerateScriptInput
): Promise<GenerateSuccess | GenerateFailure> {
  const topic = input.topic?.trim();
  if (!topic) {
    return {
      success: false,
      error: "Bitte gib ein Thema oder einen Titel ein.",
    };
  }

  try {
    checkAgentInputSafety(topic);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return { success: false, error: err.message };
    }
    throw err;
  }

  const access = await requireKiToolAccessForAction(GENERATE_COST);
  if (!access.ok) {
    if (access.credits !== undefined) {
      return insufficientCreditsError(access.credits, GENERATE_COST);
    }
    return { success: false, error: access.error };
  }
  const { userId, supabase } = access;

  if (isE2eMockGenerationsEnabled()) {
    const deduction = await deductCredits(
      supabase,
      userId,
      GENERATE_COST,
      "Script Generator",
      { generationType: "script-generator", prompt: topic.slice(0, 200) }
    );
    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }
    return {
      success: true,
      result: e2eMockScript(topic),
      creditsLeft: deduction.remainingCredits,
    };
  }

  const locale = (await getLocale()) as Locale;

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId,
      amount: GENERATE_COST,
      description: "Script Generator",
      generationType: "script-generator",
      prompt: topic.slice(0, 200),
    },
    async () => {
      const text = await callClaude(
        topic,
        input.duration,
        input.tone,
        input.language,
        input.bRoll,
        input.hookVariants,
        locale
      );
      return parseScriptResponse(text, input.hookVariants);
    }
  );

  if (!deductionResult.ok) {
    return {
      success: false,
      error: deductionResult.error,
    };
  }

  return {
    success: true,
    result: deductionResult.data,
    creditsLeft: deductionResult.remainingCredits,
  };
}

export async function regenerateScript(
  input: GenerateScriptInput
): Promise<GenerateSuccess | GenerateFailure> {
  const topic = input.topic?.trim();
  if (!topic) {
    return {
      success: false,
      error: "Bitte gib ein Thema oder einen Titel ein.",
    };
  }

  try {
    checkAgentInputSafety(topic);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return { success: false, error: err.message };
    }
    throw err;
  }

  const access = await requireKiToolAccessForAction(REGENERATE_COST);
  if (!access.ok) {
    if (access.credits !== undefined) {
      return insufficientCreditsError(access.credits, REGENERATE_COST);
    }
    return { success: false, error: access.error };
  }
  const { userId, supabase } = access;

  if (isE2eMockGenerationsEnabled()) {
    const deduction = await deductCredits(
      supabase,
      userId,
      REGENERATE_COST,
      "Script Generator (Neu)",
      {
        generationType: "script-generator",
        prompt: `Regen: ${topic.slice(0, 180)}`,
      }
    );
    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }
    return {
      success: true,
      result: e2eMockScript(`${topic} (regen)`),
      creditsLeft: deduction.remainingCredits,
    };
  }

  const locale = (await getLocale()) as Locale;

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId,
      amount: REGENERATE_COST,
      description: "Script Generator (Neu)",
      generationType: "script-generator",
      prompt: `Regen: ${topic.slice(0, 180)}`,
    },
    async () => {
      const text = await callClaude(
        topic,
        input.duration,
        input.tone,
        input.language,
        input.bRoll,
        input.hookVariants,
        locale
      );
      return parseScriptResponse(text, input.hookVariants);
    }
  );

  if (!deductionResult.ok) {
    return {
      success: false,
      error: deductionResult.error,
    };
  }

  return {
    success: true,
    result: deductionResult.data,
    creditsLeft: deductionResult.remainingCredits,
  };
}

export async function saveScript(
  topic: string,
  script: string,
  settings: ScriptSettings
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const { data, error } = await supabase
    .from("saved_scripts")
    .insert({
      user_id: user.id,
      topic: topic.trim(),
      script,
      settings,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("saveScript:", error?.message);
    return { success: false, error: "Script konnte nicht gespeichert werden." };
  }

  return { success: true, id: data.id };
}

export type SavedScriptRow = {
  id: string;
  topic: string;
  script: string;
  settings: ScriptSettings;
  created_at: string;
};

export async function listSavedScripts(): Promise<SavedScriptRow[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_scripts")
    .select("id, topic, script, settings, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listSavedScripts:", error.message);
    return [];
  }

  return (data ?? []) as SavedScriptRow[];
}

export async function getSavedScript(
  id: string
): Promise<SavedScriptRow | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("saved_scripts")
    .select("id, topic, script, settings, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return (data as SavedScriptRow) ?? null;
}

export async function deleteSavedScript(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const { error } = await supabase
    .from("saved_scripts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
