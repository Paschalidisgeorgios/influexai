import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArticleBody } from "@/components/blog/article-body";
import { ArticleCard } from "@/components/blog/article-card";
import { FAQSection } from "@/components/faq-section";
import { ArticleShare } from "@/components/blog/article-share";
import { ArticleSchema } from "@/components/blog/article-schema";
import { getBlogFaqs } from "@/lib/guides/blog-faqs";
import { ArticleToc } from "@/components/blog/article-toc";
import { categoryBadgeClass } from "@/lib/blog/categories";
import { extractTocFromMarkdown } from "@/lib/blog/markdown";
import { fetchPostBySlug, fetchRelatedPosts } from "@/lib/blog/queries";
import { SEO_BASE_URL } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) return { title: "Artikel nicht gefunden" };

  const url = `${SEO_BASE_URL}/blog/${post.slug}`;

  return {
    title: `${post.title} | InfluexAI Blog`,
    description: post.meta_description,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      url,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [post.author],
      images: post.og_image_url ? [{ url: post.og_image_url }] : undefined,
      section: post.category,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
      images: post.og_image_url ? [post.og_image_url] : undefined,
    },
    alternates: { canonical: url },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const related = await fetchRelatedPosts(post);
  const toc = extractTocFromMarkdown(post.content);
  const articleUrl = `${SEO_BASE_URL}/blog/${post.slug}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <ArticleSchema post={post} />
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-white/70">
        <Link href="/blog" className="hover:text-[#B4FF00]">
          {t("breadcrumb_blog")}
        </Link>
        <span>→</span>
        <span className="text-white/80">{post.category}</span>
        <span>→</span>
        <span className="line-clamp-1 text-white/80">{post.title}</span>
      </nav>

      <div className="flex flex-col gap-10 lg:flex-row">
        <article className="min-w-0 flex-1 max-w-3xl">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${categoryBadgeClass(post.category)}`}
          >
            {post.category}
          </span>

          <h1 className="landing-heading mt-4 text-3xl text-white md:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-lg text-white/80">{post.excerpt}</p>

          <div className="mt-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/70">
              {post.author} · {formatDate(post.published_at)} ·{" "}
              {t("min_read", { minutes: post.reading_time_minutes })}
            </p>
            <ArticleShare title={post.title} url={articleUrl} />
          </div>

          <div className="mt-8">
            <ArticleBody
              markdown={post.content}
              category={post.category}
              targetKeyword={post.target_keyword}
            />
          </div>
          <FAQSection
            faqs={getBlogFaqs({
              title: post.title,
              category: post.category,
              targetKeyword: post.target_keyword,
              content: post.content,
            })}
          />
        </article>

        <aside className="w-full shrink-0 lg:w-56">
          <ArticleToc entries={toc} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-white/10 pt-12">
          <h2 className="mb-6 text-xl font-semibold text-white">
            {t("related_title")}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ArticleCard key={r.id} post={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
