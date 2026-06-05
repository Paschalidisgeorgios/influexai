import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FAQSection } from "@/components/faq-section";
import { GuideBody, GuideAuthorBox } from "@/components/guides/guide-body";
import { GuideHeaderActions } from "@/components/guides/guide-header-actions";
import { GuideRightSidebar } from "@/components/guides/guide-right-sidebar";
import { GuideSchema } from "@/components/guides/guide-schema";
import { GuideTocSidebar } from "@/components/guides/guide-toc-sidebar";
import { extractTocFromMarkdown } from "@/lib/blog/markdown";
import { fetchGuideBySlug } from "@/lib/guides/queries";
import { isPillarSlug, PILLAR_META } from "@/lib/guides/pillars";
import { SEO_BASE_URL } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [
    { slug: "youtube-shorts-erstellen" },
    { slug: "youtube-niche-finden" },
    { slug: "viral-youtube-shorts" },
    { slug: "ki-content-creation" },
    { slug: "youtube-kanal-aufbauen" },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await fetchGuideBySlug(slug);
  if (!guide) return { title: "Guide nicht gefunden" };

  return {
    title: `${guide.title} | InfluexAI`,
    description: guide.meta_description,
    openGraph: {
      title: guide.title,
      description: guide.meta_description,
      url: `${SEO_BASE_URL}/guides/${slug}`,
      type: "article",
    },
  };
}

function formatLastUpdated(iso: string | null): string {
  if (!iso) return "März 2025";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  if (!isPillarSlug(slug)) notFound();

  const guide = await fetchGuideBySlug(slug);
  if (!guide) notFound();

  const meta = PILLAR_META[slug];
  const toc = extractTocFromMarkdown(guide.content);
  const url = `${SEO_BASE_URL}/guides/${slug}`;

  return (
    <>
      <GuideSchema guide={guide} />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <nav className="mb-6 text-sm text-white/70">
          <Link href="/guides" className="hover:text-[#B4FF00]">
            Guides
          </Link>
          <span className="mx-2">→</span>
          <span className="text-white/70 line-clamp-1">{guide.title}</span>
        </nav>

        <header className="mb-10 max-w-3xl">
          <span className="inline-flex rounded-full bg-[#B4FF00]/15 px-3 py-1 text-xs font-semibold text-[#B4FF00]">
            Kompletter Guide
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl lg:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg text-white/80">{guide.excerpt}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
            <span>
              Zuletzt aktualisiert:{" "}
              <strong className="text-white/70">
                {formatLastUpdated(guide.last_updated)}
              </strong>
            </span>
            <span>·</span>
            <span>{guide.word_count.toLocaleString("de-DE")} Wörter</span>
            <span>·</span>
            <span>ca. {guide.reading_time_minutes} Min</span>
          </div>
          <div className="mt-6">
            <GuideHeaderActions title={guide.title} url={url} pdfSlug={slug} />
          </div>
        </header>

        <div className="flex gap-8 items-start">
          <GuideTocSidebar entries={toc} />

          <article className="min-w-0 flex-1 max-w-3xl">
            <GuideBody
              markdown={guide.content}
              featuredSnippet={guide.featured_snippet}
              source={`guide-${slug}`}
            />
            <FAQSection faqs={guide.faqs.length ? guide.faqs : meta.faqs} />
            <GuideAuthorBox />
          </article>

          <GuideRightSidebar guide={guide} toc={toc} />
        </div>
      </div>
    </>
  );
}
