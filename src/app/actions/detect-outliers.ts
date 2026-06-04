"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { insufficientCreditsError } from "@/lib/credit-action-result";

const CREDIT_COST = 3;

export type ViralMechanism =
  | "curiosity_gap"
  | "contrarian"
  | "transformation"
  | "list"
  | "secret"
  | "controversy";

export type OutlierConcept = {
  title: string;
  thumbnailConcept: string;
  outlierScore: number;
  whyItWorked: [string, string, string];
  hook: string;
  viralMechanism: ViralMechanism;
};

type DetectSuccess = {
  success: true;
  outliers: OutlierConcept[];
  creditsLeft: number;
};

type DetectFailure = {
  success: false;
  error: string;
};

const MECHANISMS: ViralMechanism[] = [
  "curiosity_gap",
  "contrarian",
  "transformation",
  "list",
  "secret",
  "controversy",
];

function parseOutliers(raw: string): OutlierConcept[] {
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  const list = Array.isArray(parsed)
    ? parsed
    : (parsed?.outliers ?? parsed?.results ?? parsed?.data);
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Ungültiges JSON-Format");
  }

  return list.slice(0, 6).map((item, i) => {
    const why = item.whyItWorked ?? item.why_it_worked ?? [];
    const whyItWorked: [string, string, string] = [
      String(why[0] ?? "Starker Hook in den ersten Sekunden."),
      String(why[1] ?? "Hohe emotionale oder praktische Relevanz."),
      String(why[2] ?? "Thumbnail und Titel erzeugen Klick-Drang."),
    ];
    const mechanism = item.viralMechanism ?? item.viral_mechanism;
    const viralMechanism: ViralMechanism = MECHANISMS.includes(mechanism)
      ? mechanism
      : "curiosity_gap";
    const score = Math.min(
      10,
      Math.max(1, Number(item.outlierScore ?? item.outlier_score) || 7)
    );

    return {
      title: String(item.title ?? `Outlier ${i + 1}`),
      thumbnailConcept: String(
        item.thumbnailConcept ?? item.thumbnail_concept ?? ""
      ),
      outlierScore: score,
      whyItWorked,
      hook: String(item.hook ?? ""),
      viralMechanism,
    };
  });
}

export async function detectOutliers(
  niche: string,
  period: string,
  platform: string,
  channelSize: string
): Promise<DetectSuccess | DetectFailure> {
  if (!niche?.trim()) {
    return {
      success: false,
      error: "Bitte gib eine Nische oder ein Keyword ein.",
    };
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

  const systemPrompt =
    "Du bist ein YouTube Viral Content Analyst mit tiefem Verständnis von Outlier-Videos. Ein Outlier ist ein Video, das gemessen an der Kanalgröße überproportional viele Views generiert hat (10x-100x der normalen Performance). Antworte NUR mit validem JSON.";

  const userPrompt = `Nische: ${niche.trim()}
Zeitraum: ${period}
Plattform: ${platform}
Kanal-Größe: ${channelSize}

Generiere 6 realistische Outlier-Video-Konzepte für diese Nische.
Basiere sie auf echten Viral-Mustern (Curiosity Gap, Contrarian Takes, Transformation Stories, etc.)

JSON Format:
[{
  "title": string,
  "thumbnailConcept": string,
  "outlierScore": number,
  "whyItWorked": [string, string, string],
  "hook": string,
  "viralMechanism": "curiosity_gap"|"contrarian"|"transformation"|"list"|"secret"|"controversy"
}]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("Outlier detect API:", await response.text());
      return {
        success: false,
        error: "Analyse fehlgeschlagen. Bitte erneut versuchen.",
      };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";
    let outliers: OutlierConcept[];
    try {
      outliers = parseOutliers(text);
    } catch {
      console.error("Outlier JSON parse failed:", text.slice(0, 500));
      return {
        success: false,
        error: "Antwort konnte nicht gelesen werden. Bitte erneut versuchen.",
      };
    }

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      "Outlier Detector",
      { generationType: "outlier-detector", prompt: niche.trim() }
    );

    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }

    const { error: saveError } = await supabase.from("outlier_results").insert({
      user_id: user.id,
      niche: niche.trim(),
      results: outliers,
    });

    if (saveError) {
      console.error("outlier_results insert:", saveError.message);
    }

    return { success: true, outliers, creditsLeft: deduction.remainingCredits };
  } catch (e) {
    console.error("detectOutliers:", e);
    return { success: false, error: "Unerwarteter Fehler bei der Analyse." };
  }
}
