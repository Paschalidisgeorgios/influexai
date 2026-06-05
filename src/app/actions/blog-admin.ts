"use server";

import readingTime from "reading-time";
import { requireAdmin } from "@/lib/admin";
import { callClaude } from "@/lib/blog/claude";
import { countWords } from "@/lib/blog/markdown";
import { runBlogSeoCheck } from "@/lib/blog/seo-check";
import { slugifyTitle } from "@/lib/blog/slug";
import type { BlogPost, KeywordIdea, SeoCheckItem } from "@/lib/blog/types";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

async function adminDb() {
  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false as const, error: admin.error };
  return { ok: true as const, supabase: createServiceSupabaseClient() };
}

export async function listAdminBlogPosts(): Promise<{
  ok: boolean;
  posts?: BlogPost[];
  error?: string;
}> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, posts: (data ?? []) as BlogPost[] };
}

export async function getAdminBlogPost(
  id: string
): Promise<{ ok: boolean; post?: BlogPost; error?: string }> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return { ok: false, error: "Artikel nicht gefunden." };
  return { ok: true, post: data as BlogPost };
}

export type SaveBlogDraftInput = {
  id: string;
  title: string;
  meta_description: string;
  content: string;
  excerpt?: string;
};

export async function saveBlogDraft(
  input: SaveBlogDraftInput
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const words = countWords(input.content);
  const stats = readingTime(input.content);
  const minutes = Math.max(1, Math.ceil(stats.minutes));

  const { error } = await ctx.supabase
    .from("blog_posts")
    .update({
      title: input.title,
      meta_description: input.meta_description.slice(0, 160),
      content: input.content,
      excerpt: (input.excerpt ?? input.meta_description).slice(0, 300),
      word_count: words,
      reading_time_minutes: minutes,
    })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function publishBlogPost(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const { error } = await ctx.supabase
    .from("blog_posts")
    .update({
      published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function scheduleBlogPost(
  id: string,
  scheduledAt: string | null
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const { error } = await ctx.supabase
    .from("blog_posts")
    .update({ scheduled_at: scheduledAt })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function runBlogSeoCheckAction(
  id: string
): Promise<{ ok: boolean; checks?: SeoCheckItem[]; error?: string }> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("blog_posts")
    .select("title, meta_description, content, target_keyword")
    .eq("id", id)
    .single();

  if (error || !data) return { ok: false, error: "Artikel nicht gefunden." };

  const checks = runBlogSeoCheck({
    title: data.title,
    metaDescription: data.meta_description,
    content: data.content,
    targetKeyword: data.target_keyword,
  });

  return { ok: true, checks };
}

export async function generateKeywordIdeas(
  niche: string
): Promise<{ ok: boolean; ideas?: KeywordIdea[]; error?: string }> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const trimmed = niche.trim();
  if (!trimmed) return { ok: false, error: "Bitte Nische eingeben." };

  try {
    const text = await callClaude(
      "Antworte nur mit validem JSON-Array.",
      `Du bist SEO-Experte für YouTube Creator Tools.

Nische: ${trimmed}

Generiere 20 Keyword-Ideen:
- Long-tail mit niedrigem Wettbewerb
- Question keywords (FAQ)
- Comparison ("X vs Y")
- How-to
- Tool/Feature keywords

Antworte NUR mit JSON-Array:
[{ "keyword": string, "searchIntent": string, "difficulty": "low"|"medium"|"high", "suggestedTitle": string, "estimatedWordCount": number }]`,
      8192
    );

    const clean = text.replace(/```json|```/g, "").trim();
    const ideas = JSON.parse(clean) as KeywordIdea[];
    return { ok: true, ideas: ideas.slice(0, 20) };
  } catch (e) {
    console.error("generateKeywordIdeas:", e);
    return { ok: false, error: "Keyword-Generierung fehlgeschlagen." };
  }
}

export async function createDraftFromKeywordIdea(input: {
  keyword: string;
  suggestedTitle: string;
  category: string;
  language: string;
  estimatedWordCount: number;
}): Promise<{ ok: boolean; postId?: string; error?: string }> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const slug = slugifyTitle(input.suggestedTitle);
  const { data, error } = await ctx.supabase
    .from("blog_posts")
    .insert({
      slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
      title: input.suggestedTitle,
      meta_description: "",
      content: `# ${input.suggestedTitle}\n\nEntwurf — Inhalt generieren.`,
      excerpt: "",
      category: input.category,
      target_keyword: input.keyword,
      word_count: 0,
      language: input.language,
      published: false,
    })
    .select("id")
    .single();

  if (error || !data)
    return { ok: false, error: "Entwurf konnte nicht erstellt werden." };
  return { ok: true, postId: data.id };
}

export type UpsertBlogPostInput = {
  id?: string;
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  excerpt?: string;
  category: string;
  og_image_url?: string | null;
  published: boolean;
  language?: string;
};

export async function upsertBlogPost(
  input: UpsertBlogPostInput
): Promise<{ ok: boolean; postId?: string; error?: string }> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!slug) return { ok: false, error: "Ungültiger Slug." };

  const words = countWords(input.content);
  const stats = readingTime(input.content);
  const minutes = Math.max(1, Math.ceil(stats.minutes));

  const row = {
    title: input.title.trim(),
    slug,
    meta_description: input.meta_description.slice(0, 160),
    content: input.content,
    excerpt: (input.excerpt ?? input.meta_description).slice(0, 300),
    category: input.category,
    og_image_url: input.og_image_url?.trim() || null,
    word_count: words,
    reading_time_minutes: minutes,
    published: input.published,
    published_at: input.published ? new Date().toISOString() : null,
    language: input.language ?? "de",
  };

  if (input.id) {
    const { error } = await ctx.supabase
      .from("blog_posts")
      .update(row)
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, postId: input.id };
  }

  const { data, error } = await ctx.supabase
    .from("blog_posts")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Speichern fehlgeschlagen." };
  return { ok: true, postId: data.id };
}

export async function unpublishBlogPost(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await adminDb();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const { error } = await ctx.supabase
    .from("blog_posts")
    .update({ published: false, published_at: null })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
