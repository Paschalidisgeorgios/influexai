import type { Metadata } from "next";
import Link from "next/link";
import { fetchAllPublishedGuides } from "@/lib/guides/queries";
import { PILLAR_META, PILLAR_SLUGS } from "@/lib/guides/pillars";
import { SEO_BASE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "InfluexAI Guides — YouTube Creator Wissen",
  description:
    "Pillar Guides zu YouTube Shorts, Nischen, Viralität, KI Content und Kanalaufbau. Tiefe Leitfäden für Creator.",
  openGraph: {
    title: "InfluexAI Content Hub — Guides",
    url: `${SEO_BASE_URL}/guides`,
  },
};

export default async function GuidesIndexPage() {
  const guides = await fetchAllPublishedGuides();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Content Hub</h1>
      <p className="mt-3 text-lg text-white/50">
        Tiefe Pillar Guides für YouTube Creator — KI, Shorts, Wachstum.
      </p>

      <div className="mt-10 space-y-6">
        {PILLAR_SLUGS.map((slug) => {
          const meta = PILLAR_META[slug];
          const guide = guides.find((g) => g.slug === slug);
          return (
            <Link
              key={slug}
              href={`/guides/${slug}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-[#B4FF00]/35"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-[#B4FF00]">
                Kompletter Guide
              </span>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {meta.title}
              </h2>
              <p className="mt-2 text-sm text-white/55 line-clamp-2">
                {meta.excerpt}
              </p>
              {guide && (
                <p className="mt-3 text-xs text-white/40">
                  {guide.word_count.toLocaleString("de-DE")} Wörter · ca.{" "}
                  {guide.reading_time_minutes} Min Lesezeit
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
