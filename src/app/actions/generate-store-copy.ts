"use server";

import { requireAdmin } from "@/lib/admin";

export type StoreLocaleCopy = {
  appName: string;
  subtitle: string;
  shortDescription: string;
  fullDescription: string;
  keywords: string;
  reviewNotes: string;
};

export type StoreCopyBundle = {
  de: StoreLocaleCopy;
  en: StoreLocaleCopy;
  el: StoreLocaleCopy;
};

type Success = { success: true; copy: StoreCopyBundle };
type Failure = { success: false; error: string };

function trimField(value: unknown, max: number): string {
  const s = String(value ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function parseLocaleBlock(raw: unknown): StoreLocaleCopy {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    appName: trimField(o.appName ?? o.app_name ?? o.name, 30),
    subtitle: trimField(o.subtitle ?? o.sub_title, 30),
    shortDescription: trimField(
      o.shortDescription ?? o.short_description ?? o.playShort,
      80
    ),
    fullDescription: trimField(
      o.fullDescription ?? o.full_description ?? o.description,
      4000
    ),
    keywords: trimField(o.keywords ?? o.keyword, 100),
    reviewNotes: trimField(
      o.reviewNotes ?? o.review_notes ?? o.appReviewNotes,
      2000
    ),
  };
}

function parseBundle(raw: string): StoreCopyBundle {
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean) as Record<string, unknown>;

  return {
    de: parseLocaleBlock(parsed.de ?? parsed.DE ?? parsed.german),
    en: parseLocaleBlock(parsed.en ?? parsed.EN ?? parsed.english),
    el: parseLocaleBlock(parsed.el ?? parsed.EL ?? parsed.greek ?? parsed.gr),
  };
}

export async function generateStoreCopy(): Promise<Success | Failure> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY fehlt." };
  }

  const systemPrompt =
    "You are an expert App Store Optimization (ASO) copywriter for mobile apps. Write compelling, policy-safe store listings. Return ONLY valid JSON, no markdown.";

  const userPrompt = `Generate complete iOS App Store and Google Play store copy for InfluexAI — an AI Creator Studio for viral YouTube Shorts.

Features: Script Generator, Niche Analyzer, Outlier Detector, Thumbnail Concepts, Video Remix, Community, credit-based pricing (no forced subscription).

Generate copy for THREE languages: German (de), English (en), Greek (el).

For EACH language object, include:
- appName: max 30 chars (iOS App Store name)
- subtitle: max 30 chars (iOS subtitle only)
- shortDescription: max 80 chars (Google Play short description)
- fullDescription: max 4000 chars, store-optimized structure:
  * Hook: first 2 lines (most important — shown before "more")
  * Feature list with emojis (5-8 bullets)
  * Social proof line
  * How it works in 3 numbered steps
  * Closing CTA
- keywords: max 100 chars, comma-separated, iOS only (English keywords often work internationally; for de use German keywords, for el use Greek)
- reviewNotes: App Review notes for Apple (test account hint, demo flow, no login wall for browsing — in that language)

Example app name style: "InfluexAI — KI Creator Studio" (adapt per language).

JSON format exactly:
{
  "de": { "appName": "", "subtitle": "", "shortDescription": "", "fullDescription": "", "keywords": "", "reviewNotes": "" },
  "en": { ... },
  "el": { ... }
}`;

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
        max_tokens: 12000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("generate-store-copy:", await response.text());
      return { success: false, error: "Claude API Fehler." };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";
    if (!text) return { success: false, error: "Leere Antwort." };

    const copy = parseBundle(text);
    return { success: true, copy };
  } catch (e) {
    console.error("generateStoreCopy:", e);
    return {
      success: false,
      error: "JSON konnte nicht gelesen werden. Bitte erneut versuchen.",
    };
  }
}
