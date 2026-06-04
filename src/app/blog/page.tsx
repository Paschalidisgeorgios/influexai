import type { Metadata } from "next";
import { Suspense } from "react";
import { ArticleCard } from "@/components/blog/article-card";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { CategoryFilters } from "@/components/blog/category-filters";
import { PAGE_SIZE, fetchPublishedPosts } from "@/lib/blog/queries";
import { SEO_BASE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "InfluexAI Blog — Tipps für virale YouTube Shorts",
  description:
    "Lerne wie du mit KI virale YouTube Shorts erstellst. Niche-Analyse, Script-Writing, Thumbnail-Tipps und mehr.",
  openGraph: {
    title: "InfluexAI Blog — Tipps für virale YouTube Shorts",
    description:
      "Lerne wie du mit KI virale YouTube Shorts erstellst. Niche-Analyse, Script-Writing, Thumbnail-Tipps und mehr.",
    url: `${SEO_BASE_URL}/blog`,
    type: "website",
  },
};

type SearchParams = Promise<{ page?: string; category?: string }>;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const category = params.category ?? null;

  const { posts, total } = await fetchPublishedPosts({ page, category });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          InfluexAI Blog
        </h1>
        <p className="mt-3 text-lg text-white/50">
          Alles was du brauchst um viral zu gehen
        </p>
      </section>

      <Suspense fallback={<div className="h-12" />}>
        <CategoryFilters />
      </Suspense>

      {posts.length === 0 ? (
        <p className="mt-16 text-center text-white/40">
          Noch keine Artikel veröffentlicht. Schau bald wieder vorbei.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <BlogPagination
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        category={category}
      />
    </div>
  );
}
