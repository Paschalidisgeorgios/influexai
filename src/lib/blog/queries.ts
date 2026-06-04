import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BlogPost } from "./types";

const PAGE_SIZE = 12;

export async function fetchPublishedPosts(options: {
  page?: number;
  category?: string | null;
}): Promise<{ posts: BlogPost[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (options.category && options.category !== "Alle") {
    query = query.eq("category", options.category);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("fetchPublishedPosts:", error);
    return { posts: [], total: 0 };
  }

  return { posts: (data ?? []) as BlogPost[], total: count ?? 0 };
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as BlogPost;
}

export async function fetchRelatedPosts(
  post: BlogPost,
  limit = 3
): Promise<BlogPost[]> {
  const supabase = await createServerSupabaseClient();

  const { data: byCategory } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .eq("category", post.category)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(limit);

  if ((byCategory?.length ?? 0) >= limit) {
    return (byCategory ?? []) as BlogPost[];
  }

  const { data: byTags } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .neq("id", post.id)
    .overlaps("tags", post.tags.length ? post.tags : ["__none__"])
    .order("published_at", { ascending: false })
    .limit(limit);

  const merged = [...(byCategory ?? []), ...(byTags ?? [])];
  const seen = new Set<string>();
  const unique: BlogPost[] = [];
  for (const p of merged) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    unique.push(p as BlogPost);
    if (unique.length >= limit) break;
  }
  return unique;
}

export { PAGE_SIZE };
