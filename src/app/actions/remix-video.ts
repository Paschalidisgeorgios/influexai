"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import {
  CLAUDE_JSON_SYSTEM_RULE,
  createAnthropicMessage,
  parseClaudeJson,
} from "@/lib/anthropic";
import { extractYouTubeVideoId } from "@/lib/youtube";

const CREDIT_COST = 2;

export type RemixStructure = {
  intro: string;
  middle: string;
  cta: string;
};

export type RemixConcept = {
  remixTitle: string;
  description: string;
  hook: string;
  structure: RemixStructure;
  similarityPercent: number;
  uniqueAngle: string;
};

export type RemixVideoInput = {
  mode: "url" | "manual";
  url?: string;
  originalTitle?: string;
  videoDescription?: string;
  niche: string;
  remixStyle: string;
};

type RemixSuccess = {
  success: true;
  remixes: RemixConcept[];
  creditsLeft: number;
};

type RemixFailure = {
  success: false;
  error: string;
};

function parseRemixes(raw: string): RemixConcept[] {
  const parsed = parseClaudeJson<unknown>(raw);
  const wrapped = parsed as
    | {
        remixes?: unknown;
        results?: unknown;
        data?: unknown;
      }
    | unknown[];
  const list = Array.isArray(wrapped)
    ? wrapped
    : ((wrapped as { remixes?: unknown }).remixes ??
      (wrapped as { results?: unknown }).results ??
      (wrapped as { data?: unknown }).data);
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Ungültiges JSON-Format");
  }

  return list.slice(0, 4).map((item, i) => {
    const structureRaw = item.structure ?? {};
    const similarity = Number(
      item.similarityPercent ?? item.similarity_percent
    );
    const similarityPercent = Math.min(
      80,
      Math.max(20, Number.isFinite(similarity) ? similarity : 50)
    );

    return {
      remixTitle: String(
        item.remixTitle ?? item.remix_title ?? `Remix ${i + 1}`
      ),
      description: String(item.description ?? ""),
      hook: String(item.hook ?? ""),
      structure: {
        intro: String(structureRaw.intro ?? ""),
        middle: String(structureRaw.middle ?? ""),
        cta: String(structureRaw.cta ?? ""),
      },
      similarityPercent,
      uniqueAngle: String(item.uniqueAngle ?? item.unique_angle ?? ""),
    };
  });
}

export async function remixVideo(
  input: RemixVideoInput
): Promise<RemixSuccess | RemixFailure> {
  const niche = input.niche?.trim();
  const remixStyle = input.remixStyle?.trim();

  if (!niche) {
    return { success: false, error: "Bitte wähle deine Nische." };
  }
  if (!remixStyle) {
    return { success: false, error: "Bitte wähle einen Remix-Stil." };
  }

  let originalLabel = "";
  let originalUrl: string | null = null;
  let videoId: string | null = null;

  if (input.mode === "url") {
    const url = input.url?.trim();
    if (!url) {
      return { success: false, error: "Bitte gib eine YouTube-URL ein." };
    }
    videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return { success: false, error: "Ungültige YouTube-URL." };
    }
    originalUrl = url;
    originalLabel = input.originalTitle?.trim() || `YouTube Video (${videoId})`;
  } else {
    const desc = input.videoDescription?.trim();
    if (!desc) {
      return { success: false, error: "Bitte beschreibe das Original-Video." };
    }
    originalLabel = input.originalTitle?.trim()
      ? `${input.originalTitle.trim()}\n\n${desc}`
      : desc;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Nicht eingeloggt." };
  }

  const creditCheck = await hasEnoughCredits(supabase, user.id, CREDIT_COST);
  if (!creditCheck.ok) {
    return insufficientCreditsError(creditCheck.credits, CREDIT_COST);
  }

  const urlContext = originalUrl
    ? `URL (für Kontext, kein Zugriff auf YouTube): ${originalUrl}\nVideo-ID: ${videoId}\nHinweis: Leite typische Titel-, Hook- und Struktur-Muster aus URL/ID ab — kein echtes Video ansehen.`
    : "URL: nicht angegeben";

  const systemPrompt = `Du bist ein YouTube Content Stratege für Video-Remixing. Virale Mechaniken neu interpretieren — kein Kopieren. ${CLAUDE_JSON_SYSTEM_RULE}`;

  const userPrompt = `Original Video: ${originalLabel}
${urlContext}
Remix-Stil: ${remixStyle}
Ziel-Nische: ${niche}

Erstelle 4 einzigartige Remix-Konzepte.

JSON:
[{
  "remixTitle": string,
  "description": string,
  "hook": string,
  "structure": { "intro": string, "middle": string, "cta": string },
  "similarityPercent": number,
  "uniqueAngle": string
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
    let remixes: RemixConcept[];
    try {
      remixes = parseRemixes(text);
    } catch {
      console.error("Remix JSON parse failed:", text.slice(0, 500));
      return {
        success: false,
        error: "Antwort konnte nicht gelesen werden. Bitte erneut versuchen.",
      };
    }

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      "Video Remix",
      { generationType: "video-remix", prompt: originalLabel.slice(0, 200) }
    );

    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }

    const { error: saveError } = await supabase.from("remix_results").insert({
      user_id: user.id,
      original_url: originalUrl,
      results: remixes,
    });

    if (saveError) {
      console.error("remix_results insert:", saveError.message);
    }

    return { success: true, remixes, creditsLeft: deduction.remainingCredits };
  } catch (e) {
    console.error("remixVideo:", e);
    return { success: false, error: "Unerwarteter Fehler beim Remix." };
  }
}
