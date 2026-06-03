import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const CREDIT_COST = 5;

export async function POST(request: NextRequest) {
  const { product, platform } = await request.json();

  if (!product || !platform) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  // Nutzer prüfen und Credits kontrollieren
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits < CREDIT_COST) {
    return NextResponse.json({ error: "Nicht genug Credits" }, { status: 402 });
  }

  const platformGuides: Record<string, string> = {
    tiktok:    "TikTok (9:16, 15-60 Sek., junges Publikum, energetisch, trending)",
    instagram: "Instagram Reel (9:16, bis 90 Sek., visuell, lifestyle-orientiert)",
    youtube:   "YouTube Shorts (16:9, bis 60 Sek., informativ, klarer Mehrwert)",
    linkedin:  "LinkedIn (professionell, B2B-fokussiert, Mehrwert und Expertise)",
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
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    if (!Array.isArray(result.hashtags)) {
      result.hashtags = [];
    }

    // Credits abziehen
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - CREDIT_COST })
      .eq("id", user.id);

    return NextResponse.json({
      ...result,
      creditsUsed: CREDIT_COST,
      creditsLeft: profile.credits - CREDIT_COST,
    });
  } catch (error) {
    console.error("InfluexAI Brain Error:", error);
    return NextResponse.json({ error: "Generierung fehlgeschlagen" }, { status: 500 });
  }
}
