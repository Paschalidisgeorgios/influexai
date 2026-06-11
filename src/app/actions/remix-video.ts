"use server";

import { requireKiToolAccessForAction } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import { createAnthropicMessage } from "@/lib/anthropic";
import {
  e2eMockRemixes,
  isE2eMockGenerationsEnabled,
} from "@/lib/e2e-mock-generations";
import {
  buildRemixUserPrompt,
  parseRemixConcepts,
  REMIX_SYSTEM_PROMPT,
  remixResultsSaveErrorMessage,
  type RemixConcept,
} from "@/lib/remix-analysis";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { fetchYouTubeVideoSnippet } from "@/lib/youtube-metadata";

const CREDIT_COST = 2;

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
  saved: boolean;
  saveWarning?: string;
  youtubeMetadataUsed?: boolean;
};

type RemixFailure = {
  success: false;
  error: string;
  credits?: number;
  required?: number;
};

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

  const access = await requireKiToolAccessForAction(CREDIT_COST);
  if (!access.ok) {
    if (access.credits !== undefined) {
      return insufficientCreditsError(access.credits, CREDIT_COST);
    }
    return { success: false, error: access.error };
  }
  const { userId, supabase } = access;

  let originalLabel = "";
  let originalUrl: string | null = null;
  let videoId: string | null = null;
  let youtubeMetadataUsed = false;

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

    const snippet = await fetchYouTubeVideoSnippet(videoId);
    if (snippet) {
      youtubeMetadataUsed = true;
      originalLabel = [
        snippet.title,
        snippet.channelTitle ? `Kanal: ${snippet.channelTitle}` : "",
        snippet.description ? `Beschreibung: ${snippet.description.slice(0, 800)}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    } else {
      originalLabel =
        input.originalTitle?.trim() || `YouTube Video (${videoId})`;
    }
  } else {
    const desc = input.videoDescription?.trim();
    if (!desc) {
      return { success: false, error: "Bitte beschreibe das Original-Video." };
    }
    originalLabel = input.originalTitle?.trim()
      ? `${input.originalTitle.trim()}\n\n${desc}`
      : desc;
  }

  if (isE2eMockGenerationsEnabled()) {
    const remixes = e2eMockRemixes(niche, remixStyle);
    const deduction = await deductCredits(
      supabase,
      userId,
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
      user_id: userId,
      original_url: originalUrl,
      results: remixes,
    });
    if (saveError) {
      return {
        success: true,
        remixes,
        creditsLeft: deduction.remainingCredits,
        saved: false,
        saveWarning: remixResultsSaveErrorMessage(saveError.code),
        youtubeMetadataUsed,
      };
    }
    return {
      success: true,
      remixes,
      creditsLeft: deduction.remainingCredits,
      saved: true,
      youtubeMetadataUsed,
    };
  }

  const urlContext = originalUrl
    ? `URL: ${originalUrl}
Video-ID: ${videoId}
${youtubeMetadataUsed ? "Metadaten: von YouTube Data API geladen." : "Metadaten: nur aus URL/Titel (YOUTUBE_API_KEY optional für reichere Analyse)."}`
    : "URL: nicht angegeben";

  const userPrompt = buildRemixUserPrompt({
    originalLabel,
    urlContext,
    remixStyle,
    niche,
  });

  try {
    const claude = await createAnthropicMessage({
      system: REMIX_SYSTEM_PROMPT,
      user: userPrompt,
    });
    if (!claude.ok) {
      return { success: false, error: claude.error };
    }

    let remixes: RemixConcept[];
    try {
      remixes = parseRemixConcepts(claude.text);
    } catch {
      console.error("Remix JSON parse failed:", claude.text.slice(0, 500));
      return {
        success: false,
        error: "Antwort konnte nicht gelesen werden. Bitte erneut versuchen.",
      };
    }

    const deduction = await deductCredits(
      supabase,
      userId,
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
      user_id: userId,
      original_url: originalUrl,
      results: remixes,
    });

    if (saveError) {
      console.error("remix_results insert:", saveError.message, saveError.code);
      return {
        success: true,
        remixes,
        creditsLeft: deduction.remainingCredits,
        saved: false,
        saveWarning: remixResultsSaveErrorMessage(saveError.code),
        youtubeMetadataUsed,
      };
    }

    return {
      success: true,
      remixes,
      creditsLeft: deduction.remainingCredits,
      saved: true,
      youtubeMetadataUsed,
    };
  } catch (e) {
    console.error("remixVideo:", e);
    return { success: false, error: "Unerwarteter Fehler beim Remix." };
  }
}
