"use server";

import { requireAdmin } from "@/lib/admin";

export type PhTagline = { angle: string; text: string };

export type PhLaunchCopy = {
  taglines: PhTagline[];
  description: string;
  makerComment: string;
  firstReplyTemplate: string;
  twitterThread: [string, string, string];
};

type Success = { success: true; copy: PhLaunchCopy };
type Failure = { success: false; error: string };

function parseCopy(raw: string): PhLaunchCopy {
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  const taglinesRaw = parsed.taglines ?? parsed.tagline_variants ?? [];
  const taglines: PhTagline[] = Array.isArray(taglinesRaw)
    ? taglinesRaw.slice(0, 3).map((t: unknown, i: number) => {
        if (typeof t === "string") {
          const angles = ["Power angle", "Benefit angle", "Curiosity angle"];
          return {
            angle: angles[i] ?? `Variant ${i + 1}`,
            text: t.slice(0, 60),
          };
        }
        const o = t as Record<string, unknown>;
        return {
          angle: String(o.angle ?? o.type ?? `Variant ${i + 1}`),
          text: String(o.text ?? o.tagline ?? "").slice(0, 60),
        };
      })
    : [];

  const threadRaw = parsed.twitterThread ?? parsed.twitter_thread ?? [];
  const twitterThread: [string, string, string] = [
    String(threadRaw[0] ?? parsed.twitter1 ?? ""),
    String(threadRaw[1] ?? parsed.twitter2 ?? ""),
    String(threadRaw[2] ?? parsed.twitter3 ?? ""),
  ];

  return {
    taglines,
    description: String(parsed.description ?? ""),
    makerComment: String(parsed.makerComment ?? parsed.maker_comment ?? ""),
    firstReplyTemplate: String(
      parsed.firstReplyTemplate ?? parsed.first_reply_template ?? ""
    ),
    twitterThread,
  };
}

export async function generatePhCopy(): Promise<Success | Failure> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY fehlt." };
  }

  const systemPrompt =
    "Du bist ein ProductHunt Launch Experte für SaaS und Creator Tools. Schreibe überzeugendes Launch-Copy auf Deutsch. Antworte NUR mit validem JSON.";

  const userPrompt = `Erstelle vollständiges ProductHunt Launch-Copy für InfluexAI — ein KI Creator Studio für YouTube Shorts.

Features: Niche Analyzer, Outlier Detector, Script Generator, Thumbnail Concepts.

JSON Format:
{
  "taglines": [
    {"angle": "Power angle", "text": "max 60 Zeichen"},
    {"angle": "Benefit angle", "text": "max 60 Zeichen"},
    {"angle": "Curiosity angle", "text": "max 60 Zeichen"}
  ],
  "description": "250 Wörter ProductHunt Beschreibung: Problem → Solution → Features → CTA. Ende mit: Credits ab €4,99 — kein Abo",
  "makerComment": "Persönlicher Maker Comment vom Founder: Ich habe InfluexAI gebaut weil..., Was anders ist, PH-Angebot, Bitte um Feedback",
  "firstReplyTemplate": "Danke-Template für erste Kommentare mit Platzhalter {personalized element}",
  "twitterThread": ["Tweet 1: Wir sind live auf ProductHunt", "Tweet 2: 3 Bullet Points was InfluexAI macht", "Tweet 3: Special PRODUCTHUNT Code 20% mehr Credits"]
}

Beispiel-Taglines als Inspiration (nicht kopieren):
- Power: Das KI Studio für virale YouTube Shorts
- Benefit: Virale Shorts in 60 Sekunden mit KI
- Curiosity: Wie Creator 10× mehr Views bekommen`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
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
      console.error("generate-ph-copy:", await response.text());
      return { success: false, error: "Claude API Fehler." };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";
    const copy = parseCopy(text);
    return { success: true, copy };
  } catch (e) {
    console.error("generatePhCopy:", e);
    return {
      success: false,
      error: "Copy konnte nicht generiert werden.",
    };
  }
}
