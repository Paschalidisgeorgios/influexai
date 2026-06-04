import { SEO_BASE_URL } from "@/lib/seo";
import type { Guide } from "@/lib/guides/types";
import { PILLAR_META, isPillarSlug } from "@/lib/guides/pillars";

export function GuideSchema({ guide }: { guide: Guide }) {
  const meta = isPillarSlug(guide.slug) ? PILLAR_META[guide.slug] : null;
  const schemaType = meta?.schemaType ?? "Article";

  const base = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: guide.title,
    description: guide.meta_description,
    datePublished: guide.published_at ?? guide.created_at,
    dateModified: guide.updated_at,
    author: {
      "@type": "Organization",
      name: "InfluexAI",
    },
    publisher: {
      "@type": "Organization",
      name: "InfluexAI",
      url: SEO_BASE_URL,
    },
    mainEntityOfPage: `${SEO_BASE_URL}/guides/${guide.slug}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(base) }}
    />
  );
}
