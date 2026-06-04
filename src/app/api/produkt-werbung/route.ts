import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { createAnthropicMessage } from "@/lib/anthropic";

const CREDIT_COST = 5;

export async function POST(request: NextRequest) {
  const { product, platform } = await request.json();

  if (!product || !platform) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  // Nutzer prüfen und Credits kontrollieren
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const creditCheck = await hasEnoughCredits(supabase, user.id, CREDIT_COST);
  if (!creditCheck.ok) {
    return NextResponse.json({ error: "Nicht genug Credits" }, { status: 402 });
  }

  const platformGuides: Record<string, string> = {
    tiktok: "TikTok (9:16, 15-60 Sek., junges Publikum, energetisch, trending)",
    instagram:
      "Instagram Reel (9:16, bis 90 Sek., visuell, lifestyle-orientiert)",
    youtube: "YouTube Shorts (16:9, bis 60 Sek., informativ, klarer Mehrwert)",
    linkedin:
      "LinkedIn (professionell, B2B-fokussiert, Mehrwert und Expertise)",
  };

  const systemPrompt = `Du bist InfluexAI Brain, ein Experte für virales Social Media Marketing.
Du erstellst hochkonvertierende Video-Werbescripte für ${platformGuides[platform]}.
Antworte NUR mit validem JSON, ohne Markdown-Backticks oder zusätzlichen Text.`;

  const userPrompt = `Erstelle einen kompletten Werbespot für folgendes Produkt/Dienstleistung:

${product}

Zielplattform: ${platformGuides[platform]}

Antworte mit diesem JSON-Format (auf Deutsch):
{
  "hook": "Die ersten 3 Sekunden - ein starker Aufhänger der sofort Aufmerksamkeit erregt",
  "script": "Das komplette Video-Script mit natürlicher Sprache, Pausen markiert mit [PAUSE], Betonungen mit *Wort*. Maximal 150 Wörter.",
  "caption": "Die fertige Caption für den Post, mit Emojis, ansprechend und zur Handlung auffordernd",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"],
  "cta": "Ein starker Call-to-Action Satz für das Ende des Videos"
}`;

  try {
    const claude = await createAnthropicMessage({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 1024,
      model: "claude-opus-4-5",
    });
    if (!claude.ok) {
      return NextResponse.json({ error: claude.error }, { status: 503 });
    }
    const text = claude.text;
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    if (!Array.isArray(result.hashtags)) {
      result.hashtags = [];
    }

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      `Produkt-Werbung (${platform})`,
      { generationType: "produkt", prompt: product.slice(0, 500) }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits" },
        { status: 402 }
      );
    }

    return NextResponse.json({
      ...result,
      creditsUsed: CREDIT_COST,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (error) {
    console.error("InfluexAI Brain Error:", error);
    return NextResponse.json(
      { error: "Generierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
