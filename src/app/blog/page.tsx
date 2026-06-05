import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ArticleCard } from "@/components/blog/article-card";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { BlogSearch } from "@/components/blog/blog-search";
import { CategoryFilters } from "@/components/blog/category-filters";
import { ContentEmailCaptureInline } from "@/components/content-email-capture";
import { PAGE_SIZE, fetchPublishedPosts } from "@/lib/blog/queries";
import { SEO_BASE_URL } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blog");
  return {
    title: `${t("title")} — InfluexAI`,
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      url: `${SEO_BASE_URL}/blog`,
      type: "website",
    },
  };
}

type SearchParams = Promise<{ page?: string; category?: string; q?: string }>;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const t = await getTranslations("blog");
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const category = params.category ?? null;
  const search = params.q ?? null;

  const { posts, total } = await fetchPublishedPosts({ page, category, search });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="mb-10 text-center md:text-left">
        <h1 className="landing-heading text-4xl text-white md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-white/80">{t("subtitle")}</p>
      </section>

      <div className="mb-8">
        <Suspense fallback={<div className="h-11" />}>
          <BlogSearch />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-12" />}>
        <CategoryFilters />
      </Suspense>

      {posts.length === 0 ? (
        <p className="mt-16 text-center text-white/70">
          {search ? t("no_results") : t("no_posts")}
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
        search={search}
      />

      <section className="mt-16 max-w-xl mx-auto md:mx-0">
        <ContentEmailCaptureInline source="blog-index" />
      </section>
    </div>
  );
}
