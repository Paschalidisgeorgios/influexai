"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireKiToolAccessForAction } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import { createAnthropicMessage } from "@/lib/anthropic";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";

const CREDIT_COST = 1;

export type ThumbnailCssElement = {
  type: "text" | "shape" | "face_placeholder";
  content: string;
  x: string;
  y: string;
  width: string;
  height: string;
  color: string;
  fontSize?: string;
  fontWeight?: string;
};

export type ThumbnailCssLayout = {
  backgroundColor: string;
  elements: ThumbnailCssElement[];
};

export type TextOverlay = {
  text: string;
  position: string;
  size: string;
  color: string;
};

export type ColorPalette = {
  background: string;
  mainText: string;
  accent: string;
};

export type ThumbnailConcept = {
  conceptTitle: string;
  layoutDescription: string;
  textOverlays: TextOverlay[];
  colorPalette: ColorPalette;
  emotion: string;
  props: string[];
  ctrPrediction: "low" | "medium" | "high";
  ctrReasoning: string;
  cssLayout: ThumbnailCssLayout;
};

type GenerateSuccess = {
  success: true;
  concepts: ThumbnailConcept[];
  creditsLeft: number;
};

type GenerateFailure = {
  success: false;
  error: string;
};

type SaveSuccess = { success: true };
type SaveFailure = { success: false; error: string };

function normalizeHex(hex: string): string {
  const t = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) return t;
  return "#1a1a1a";
}

function parseElement(raw: Record<string, unknown>): ThumbnailCssElement {
  const type = raw.type as string;
  const validType =
    type === "text" || type === "shape" || type === "face_placeholder"
      ? type
      : "shape";
  return {
    type: validType,
    content: String(raw.content ?? ""),
    x: String(raw.x ?? "0%"),
    y: String(raw.y ?? "0%"),
    width: String(raw.width ?? "20%"),
    height: String(raw.height ?? "20%"),
    color: String(raw.color ?? "#B4FF00"),
    fontSize: raw.fontSize ? String(raw.fontSize) : undefined,
    fontWeight: raw.fontWeight ? String(raw.fontWeight) : undefined,
  };
}

function parseConcept(raw: Record<string, unknown>): ThumbnailConcept {
  const paletteRaw = (raw.colorPalette ?? raw.color_palette ?? {}) as Record<
    string,
    unknown
  >;
  const cssRaw = (raw.cssLayout ?? raw.css_layout ?? {}) as Record<
    string,
    unknown
  >;
  const elementsRaw = cssRaw.elements;
  const elements = Array.isArray(elementsRaw)
    ? elementsRaw.map((el) => parseElement(el as Record<string, unknown>))
    : [];

  const overlaysRaw = raw.textOverlays ?? raw.text_overlays ?? [];
  const textOverlays: TextOverlay[] = Array.isArray(overlaysRaw)
    ? overlaysRaw.map((o) => {
        const item = o as Record<string, unknown>;
        return {
          text: String(item.text ?? ""),
          position: String(item.position ?? ""),
          size: String(item.size ?? ""),
          color: String(item.color ?? ""),
        };
      })
    : [];

  const propsRaw = raw.props ?? [];
  const props = Array.isArray(propsRaw) ? propsRaw.map((p) => String(p)) : [];

  let ctr = String(
    raw.ctrPrediction ?? raw.ctr_prediction ?? "medium"
  ).toLowerCase();
  if (ctr !== "low" && ctr !== "high") ctr = "medium";

  return {
    conceptTitle: String(raw.conceptTitle ?? raw.concept_title ?? "Konzept"),
    layoutDescription: String(
      raw.layoutDescription ?? raw.layout_description ?? ""
    ),
    textOverlays,
    colorPalette: {
      background: normalizeHex(String(paletteRaw.background ?? "#111111")),
      mainText: normalizeHex(
        String(paletteRaw.mainText ?? paletteRaw.main_text ?? "#FFFFFF")
      ),
      accent: normalizeHex(String(paletteRaw.accent ?? "#B4FF00")),
    },
    emotion: String(raw.emotion ?? ""),
    props,
    ctrPrediction: ctr as "low" | "medium" | "high",
    ctrReasoning: String(raw.ctrReasoning ?? raw.ctr_reasoning ?? ""),
    cssLayout: {
      backgroundColor: normalizeHex(
        String(
          cssRaw.backgroundColor ??
            cssRaw.background_color ??
            paletteRaw.background ??
            "#111111"
        )
      ),
      elements,
    },
  };
}

function parseConceptsResponse(raw: string): ThumbnailConcept[] {
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.concepts)
      ? parsed.concepts
      : null;
  if (!list || list.length === 0) throw new Error("EMPTY");
  return list
    .slice(0, 4)
    .map((item: unknown) => parseConcept(item as Record<string, unknown>));
}

async function callClaude(
  topic: string,
  style: string,
  colorEnergy: string
): Promise<string> {
  const systemPrompt =
    "Du bist ein YouTube Thumbnail Designer mit Expertise in Click-Through-Rate Optimierung. Du kennst die psychologischen Trigger die Menschen dazu bringen auf Thumbnails zu klicken. Antworte NUR mit validem JSON.";

  const userPrompt = `Video Thema: ${topic}
Stil: ${style}
Farb-Energie: ${colorEnergy}

Erstelle 4 verschiedene Thumbnail-Konzepte.

JSON Format:
[{
  "conceptTitle": string,
  "layoutDescription": string,
  "textOverlays": [{"text": string, "position": string, "size": string, "color": string}],
  "colorPalette": {"background": string (hex), "mainText": string (hex), "accent": string (hex)},
  "emotion": string,
  "props": [string],
  "ctrPrediction": "low"|"medium"|"high",
  "ctrReasoning": string,
  "cssLayout": {
    "backgroundColor": string,
    "elements": [{
      "type": "text"|"shape"|"face_placeholder",
      "content": string,
      "x": string,
      "y": string,
      "width": string,
      "height": string,
      "color": string,
      "fontSize": string (optional),
      "fontWeight": string (optional)
    }]
  }
}]`;

  const claude = await createAnthropicMessage({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 8192,
  });
  if (!claude.ok) {
    throw new Error(claude.error);
  }
  return claude.text;
}

export async function generateThumbnailConcepts(input: {
  topic: string;
  style: string;
  colorEnergy: string;
}): Promise<GenerateSuccess | GenerateFailure> {
  const topic = input.topic?.trim();
  if (!topic) {
    return {
      success: false,
      error: "Bitte gib einen Video-Titel oder ein Thema ein.",
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

  const access = await requireKiToolAccessForAction(CREDIT_COST);
  if (!access.ok) {
    if (access.credits !== undefined) {
      return insufficientCreditsError(access.credits, CREDIT_COST);
    }
    return { success: false, error: access.error };
  }
  const { userId, supabase } = access;

  try {
    const deductionResult = await withCreditDeduction(
      {
        supabase,
        userId,
        amount: CREDIT_COST,
        description: "Thumbnail Konzept",
        generationType: "thumbnail-concept",
        prompt: topic.slice(0, 200),
      },
      async () => {
        const text = await callClaude(topic, input.style, input.colorEnergy);
        const concepts = parseConceptsResponse(text);

        const { error: saveError } = await supabase
          .from("thumbnail_concepts")
          .insert({
            user_id: userId,
            topic,
            concepts,
          });

        if (saveError) {
          console.error("thumbnail_concepts insert:", saveError.message);
        }

        return concepts;
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
      concepts: deductionResult.data,
      creditsLeft: deductionResult.remainingCredits,
    };
  } catch (e) {
    if (e instanceof Error && e.message === "API_ERROR") {
      return {
        success: false,
        error: "Generierung fehlgeschlagen. Bitte erneut versuchen.",
      };
    }
    const msg = e instanceof Error ? e.message : "";
    console.error("generateThumbnailConcepts:", e);
    return {
      success: false,
      error:
        msg && msg.includes("KI ist")
          ? msg
          : "Generierung fehlgeschlagen. Bitte erneut versuchen.",
    };
  }
}

export async function saveThumbnailConcept(input: {
  topic: string;
  concept: ThumbnailConcept;
}): Promise<SaveSuccess | SaveFailure> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const { error } = await supabase.from("thumbnail_concepts").insert({
    user_id: user.id,
    topic: input.topic.trim(),
    concepts: [input.concept],
  });

  if (error) {
    console.error("saveThumbnailConcept:", error.message, error.code);
    return {
      success: false,
      error:
        error.code === "42P01"
          ? "Speichern ist gerade nicht möglich. Bitte später erneut versuchen."
          : `Speichern fehlgeschlagen: ${error.message}`,
    };
  }

  return { success: true };
}
