"use server";

import readingTime from "reading-time";
import { requireAdmin } from "@/lib/admin";
import { callClaude, languageLabel } from "@/lib/blog/claude";
import {
  categoryCtaLabel,
  categoryToFeaturePath,
} from "@/lib/blog/categories";
import { countWords } from "@/lib/blog/markdown";
import { slugifyTitle } from "@/lib/blog/slug";
import type { BlogOutlineResult } from "@/lib/blog/types";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export type GenerateBlogInput = {
  targetKeyword: string;
  secondaryKeywords: string;
  category: string;
  language: string;
  wordCount: number;
};

export type GenerateBlogSuccess = {
  success: true;
  postId: string;
  slug: string;
};

export type GenerateBlogFailure = {
  success: false;
  error: string;
};

function parseOutlineJson(raw: string): BlogOutlineResult {
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean) as BlogOutlineResult;
  if (!parsed.title || !parsed.outline?.length) {
    throw new Error("Ungültiges Outline-JSON");
  }
  return parsed;
}

async function generateOutline(input: GenerateBlogInput): Promise<BlogOutlineResult> {
  const secondary = input.secondaryKeywords.trim();
  const lang = languageLabel(input.language);

  const prompt = `Du bist ein SEO-Experte und Content-Stratege spezialisiert auf YouTube und Content Creation.

Target Keyword: ${input.targetKeyword}
Secondary Keywords: ${secondary}
Sprache: ${lang}
Ziel-Wortanzahl: ${input.wordCount}

Erstelle einen detaillierten Artikel-Outline der:
1. Search Intent des Keywords erfüllt
2. E-E-A-T Signale zeigt (Experience, Expertise, Authoritativeness, Trust)
3. Alle secondary keywords natürlich einbaut
4. Eine logische H2/H3 Struktur hat
5. Ein Featured Snippet anstrebt (definition box, list, oder table)

Antworte NUR mit JSON:
{
  "title": string (max 60 chars, enthält target keyword),
  "metaDescription": string (max 160 chars, enthält keyword, CTA),
  "excerpt": string (max 300 chars),
  "outline": [{ "heading": string, "type": "h2"|"h3", "keyPoints": string[] }],
  "featuredSnippetType": "definition"|"list"|"table"|"steps"
}`;

  const text = await callClaude(
    "Du antwortest nur mit validem JSON, ohne Markdown-Wrapper.",
    prompt,
    4096
  );
  return parseOutlineJson(text);
}

async function writeArticleFromOutline(
  input: GenerateBlogInput,
  outline: BlogOutlineResult
): Promise<string> {
  const lang = languageLabel(input.language);
  const feature = categoryCtaLabel(input.category);
  const featurePath = categoryToFeaturePath(input.category);
  const secondary = input.secondaryKeywords.trim();

  const prompt = `Du bist ein professioneller Content Writer für YouTube und Creator Economy.

Schreibe einen vollständigen SEO-optimierten Artikel basierend auf diesem Outline:
${JSON.stringify(outline.outline, null, 2)}

Target Keyword: ${input.targetKeyword} (muss in H1, ersten 100 Wörtern, und mehrfach im Text vorkommen)
Secondary Keywords: ${secondary} (natürlich einbauen)
Zielgruppe: YouTube Creator, Content Creator, Influencer (Anfänger bis Fortgeschrittene)

WICHTIGE REGELN:
- Schreibe auf ${lang}, natürlich und lesbar (keine KI-klingende Sprache)
- Verwende konkrete Beispiele und actionable Tipps
- Füge am Anfang einen Featured Snippet Absatz ein (${outline.featuredSnippetType} format)
- Interne Links: erwähne 2-3 mal InfluexAI Features als Lösung (natürlich, nicht spammy), verlinke zu ${featurePath}
- Füge am Ende einen CTA ein: 'Probiere ${feature} kostenlos aus →' mit Link zu ${featurePath}
- Markdown Format mit korrekten H2/H3 Tags (H1 nur einmal am Anfang mit #)
- Ziel: ca. ${input.wordCount} Wörter

Antworte NUR mit dem Artikel-Markdown, keine JSON-Wrapper.`;

  return callClaude(
    "Du schreibst nur Markdown-Artikel, keine Erklärungen drumherum.",
    prompt,
    12000
  );
}

export async function generateBlogPost(
  input: GenerateBlogInput
): Promise<GenerateBlogSuccess | GenerateBlogFailure> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const keyword = input.targetKeyword?.trim();
  if (!keyword) {
    return { success: false, error: "Bitte Target Keyword eingeben." };
  }

  const { getAnthropicConfigError } = await import("@/lib/anthropic");
  const configError = getAnthropicConfigError();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const outline = await generateOutline(input);
    const content = await writeArticleFromOutline(input, outline);

    const words = countWords(content);
    const stats = readingTime(content);
    const minutes = Math.max(1, Math.ceil(stats.minutes));

    let slug = slugifyTitle(outline.title);
    const supabase = createServiceSupabaseClient();

    const { data: existing } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const secondaryList = input.secondaryKeywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { data: row, error } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title: outline.title.slice(0, 120),
        meta_description: outline.metaDescription.slice(0, 160),
        excerpt: outline.excerpt.slice(0, 300),
        content,
        category: input.category,
        tags: secondaryList.slice(0, 8),
        target_keyword: keyword,
        secondary_keywords: secondaryList,
        reading_time_minutes: minutes,
        word_count: words,
        language: input.language,
        published: false,
      })
      .select("id, slug")
      .single();

    if (error || !row) {
      console.error("blog_posts insert:", error);
      return { success: false, error: "Speichern fehlgeschlagen." };
    }

    return { success: true, postId: row.id, slug: row.slug };
  } catch (e) {
    console.error("generateBlogPost:", e);
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Generierung fehlgeschlagen.",
    };
  }
}
