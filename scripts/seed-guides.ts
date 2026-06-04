/**
 * Seed pillar guides into Supabase. Run: npx tsx scripts/seed-guides.ts
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import readingTime from "reading-time";
import { createClient } from "@supabase/supabase-js";
import { PILLAR_META, PILLAR_SLUGS } from "../src/lib/guides/pillars";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const slug of PILLAR_SLUGS) {
    const meta = PILLAR_META[slug];
    const content = readFileSync(
      join(process.cwd(), "content", "guides", `${slug}.md`),
      "utf8"
    );
    const words = countWords(content);
    const stats = readingTime(content);
    const now = new Date().toISOString();

    const row = {
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
      word_count: words,
      featured_snippet: meta.featured_snippet,
      faqs: meta.faqs,
      published: true,
      published_at: now,
      last_updated: "2025-03-01",
      language: "de",
    };

    const { error } = await supabase.from("guides").upsert(row, {
      onConflict: "slug",
    });

    if (error) console.error(slug, error.message);
    else console.log("OK", slug, words, "words");
  }
}

main();
