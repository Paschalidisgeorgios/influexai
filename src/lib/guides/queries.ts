import readingTime from "reading-time";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { countWords } from "@/lib/blog/markdown";
import { loadPillarMarkdown } from "./load-content";
import {
  PILLAR_META,
  PILLAR_SLUGS,
  isPillarSlug,
  type PillarSlug,
} from "./pillars";
import type { Guide, GuideFaq } from "./types";

function buildGuideFromPillar(slug: PillarSlug): Guide {
  const meta = PILLAR_META[slug];
  const content = loadPillarMarkdown(slug);
  const words = countWords(content);
  const stats = readingTime(content);
  const now = new Date().toISOString();

  return {
    id: `pillar-${slug}`,
    slug,
    title: meta.title,
    meta_description: meta.meta_description,
    content,
    excerpt: meta.excerpt,
    category: meta.category,
    tags: meta.pillar_keywords,
    target_keyword: meta.target_keyword,
    secondary_keywords: meta.pillar_keywords,
    pillar_keywords: meta.pillar_keywords,
    cluster_articles: meta.cluster_articles,
    reading_time_minutes: Math.max(1, Math.ceil(stats.minutes)),
    published: true,
    published_at: now,
    last_updated: "2025-03-01",
    updated_at: now,
    created_at: now,
    author: "InfluexAI Team",
    og_image_url: null,
    word_count: words,
    language: "de",
    featured_snippet: meta.featured_snippet,
    faqs: meta.faqs,
  };
}

export async function fetchGuideBySlug(slug: string): Promise<Guide | null> {
  if (isPillarSlug(slug)) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("guides")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (data) {
      return normalizeGuideRow(data);
    }
    return buildGuideFromPillar(slug);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("guides")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeGuideRow(data);
}

function normalizeGuideRow(row: Record<string, unknown>): Guide {
  const faqs = Array.isArray(row.faqs)
    ? (row.faqs as GuideFaq[])
    : [];

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    meta_description: String(row.meta_description ?? ""),
    content: String(row.content ?? ""),
    excerpt: String(row.excerpt ?? ""),
    category: String(row.category ?? "Guide"),
    tags: (row.tags as string[]) ?? [],
    target_keyword: String(row.target_keyword ?? ""),
    secondary_keywords: (row.secondary_keywords as string[]) ?? [],
    pillar_keywords: (row.pillar_keywords as string[]) ?? [],
    cluster_articles: (row.cluster_articles as string[]) ?? [],
    reading_time_minutes: Number(row.reading_time_minutes ?? 1),
    published: Boolean(row.published),
    published_at: row.published_at ? String(row.published_at) : null,
    last_updated: row.last_updated ? String(row.last_updated) : null,
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    created_at: String(row.created_at ?? new Date().toISOString()),
    author: String(row.author ?? "InfluexAI Team"),
    og_image_url: row.og_image_url ? String(row.og_image_url) : null,
    word_count: Number(row.word_count ?? 0),
    language: String(row.language ?? "de"),
    featured_snippet: String(row.featured_snippet ?? ""),
    faqs,
  };
}

export async function fetchAllPublishedGuides(): Promise<Guide[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("guides")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const fromDb = (data ?? []).map(normalizeGuideRow);
  const dbSlugs = new Set(fromDb.map((g) => g.slug));

  const pillars = PILLAR_SLUGS.filter((s) => !dbSlugs.has(s)).map((s) =>
    buildGuideFromPillar(s)
  );

  return [...pillars, ...fromDb];
}

export function getRelatedGuides(currentSlug: string, limit = 3): Guide[] {
  return PILLAR_SLUGS.filter((s) => s !== currentSlug)
    .slice(0, limit)
    .map((s) => buildGuideFromPillar(s));
}
