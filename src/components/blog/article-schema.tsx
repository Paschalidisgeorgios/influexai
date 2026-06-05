import { SEO_BASE_URL } from "@/lib/seo";
import type { BlogPost } from "@/lib/blog/types";

export function ArticleSchema({ post }: { post: BlogPost }) {
  const url = `${SEO_BASE_URL}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.og_image_url ? [post.og_image_url] : undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "InfluexAI",
      logo: {
        "@type": "ImageObject",
        url: `${SEO_BASE_URL}/icon-192.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleSection: post.category,
    keywords: post.tags?.join(", "),
    timeRequired: `PT${post.reading_time_minutes}M`,
    inLanguage: post.language,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
