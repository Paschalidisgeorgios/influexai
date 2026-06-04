"use server";

import { getLocale } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import { localeToPromptLanguage, type Locale } from "@/lib/locale";
import {
  e2eMockScript,
  isE2eMockGenerationsEnabled,
} from "@/lib/e2e-mock-generations";
import { createAnthropicMessage } from "@/lib/anthropic";

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
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  const data = parsed?.script !== undefined ? parsed : (parsed?.data ?? parsed);

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
  const systemPrompt = `You are a professional short-form video script writer. You know psychological triggers that keep viewers watching. Write scripts with clear structure: Hook → Value/Story → CTA. Use [HOOK], [MAIN], [CTA] tags. Always respond in ${outputLanguage}. Reply ONLY with valid JSON.`;

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

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const creditCheck = await hasEnoughCredits(supabase, user.id, GENERATE_COST);
  if (!creditCheck.ok) {
    return insufficientCreditsError(creditCheck.credits, GENERATE_COST);
  }

  if (isE2eMockGenerationsEnabled()) {
    const deduction = await deductCredits(
      supabase,
      user.id,
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

  try {
    const text = await callClaude(
      topic,
      input.duration,
      input.tone,
      input.language,
      input.bRoll,
      input.hookVariants,
      locale
    );
    const result = parseScriptResponse(text, input.hookVariants);

    const deduction = await deductCredits(
      supabase,
      user.id,
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

    return { success: true, result, creditsLeft: deduction.remainingCredits };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg &&
      (msg.includes("ANTHROPIC") ||
        msg.includes("Anthropic") ||
        msg.includes("KI ist") ||
        msg.includes("sk-ant"))
    ) {
      return { success: false, error: msg };
    }
    console.error("generateScript:", e);
    return {
      success: false,
      error: "Antwort konnte nicht gelesen werden. Bitte erneut versuchen.",
    };
  }
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

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    REGENERATE_COST
  );
  if (!creditCheck.ok) {
    return insufficientCreditsError(creditCheck.credits, REGENERATE_COST);
  }

  if (isE2eMockGenerationsEnabled()) {
    const deduction = await deductCredits(
      supabase,
      user.id,
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

  try {
    const text = await callClaude(
      topic,
      input.duration,
      input.tone,
      input.language,
      input.bRoll,
      input.hookVariants,
      locale
    );
    const result = parseScriptResponse(text, input.hookVariants);

    const deduction = await deductCredits(
      supabase,
      user.id,
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

    return { success: true, result, creditsLeft: deduction.remainingCredits };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg &&
      (msg.includes("ANTHROPIC") ||
        msg.includes("Anthropic") ||
        msg.includes("KI ist") ||
        msg.includes("sk-ant"))
    ) {
      return { success: false, error: msg };
    }
    console.error("regenerateScript:", e);
    return {
      success: false,
      error: "Antwort konnte nicht gelesen werden. Bitte erneut versuchen.",
    };
  }
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

  const { data } = await supabase
    .from("saved_scripts")
    .select("id, topic, script, settings, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
