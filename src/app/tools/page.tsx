import type { Metadata } from "next";
import Link from "next/link";
import { ToolsIndexClient } from "@/components/tools/tools-index-client";
import { FEATURES, NICHES } from "@/lib/programmatic-seo";
import { SEO_BASE_URL } from "@/lib/seo";

const featureCount = Object.keys(FEATURES).length;
const nicheCount = Object.keys(NICHES).length;

export const metadata: Metadata = {
  title: "KI-Tools für jeden Creator-Typ | InfluexAI",
  description: `Alle ${featureCount} InfluexAI Tools für ${nicheCount}+ Creator-Nischen. Script Generator, Niche Analyzer, Outlier Detector und mehr.`,
  openGraph: {
    title: "Alle KI-Tools für jeden Creator-Typ | InfluexAI",
    description:
      "Programmatische Tool-Landingpages für jede Nische und jedes Feature.",
    url: `${SEO_BASE_URL}/tools`,
  },
};

export default function ToolsIndexPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-[#B4FF00]">
            InfluexAI
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#B4FF00] px-4 py-2 text-sm font-semibold text-black hover:bg-[#c8ff33]"
          >
            Starten
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold md:text-4xl">
          Alle KI-Tools für jeden Creator-Typ
        </h1>
        <p className="mt-3 max-w-2xl text-white/80">
          {featureCount} Tools × {nicheCount} Nischen ={" "}
          {featureCount * nicheCount} spezialisierte Landingpages für
          Long-Tail-SEO.
        </p>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/tools/viral-hook-extraktor"
            className="group rounded-2xl border border-white/10 bg-[#0f0f12] p-6 transition-colors hover:border-[#B4FF00]/40"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="rounded-full bg-[#B4FF00] px-2 py-0.5 text-[0.65rem] font-bold text-[#060608]">
                NEU
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white group-hover:text-[#B4FF00]">
              Viral Hook Extraktor
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Thema, Nische oder Transkript → virale Hooks in Sekunden. 1 Credit.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-[#B4FF00]">
              Tool öffnen →
            </span>
          </Link>

          <Link
            href="/tools/content-kalender"
            className="group rounded-2xl border border-white/10 bg-[#0f0f12] p-6 transition-colors hover:border-[#B4FF00]/40"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="rounded-full bg-[#B4FF00] px-2 py-0.5 text-[0.65rem] font-bold text-[#060608]">
                NEU
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white group-hover:text-[#B4FF00]">
              Content Kalender KI
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Nische + Plattform + Frequenz → 4-Wochen Plan. 2 Credits.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-[#B4FF00]">
              Tool öffnen →
            </span>
          </Link>

          <Link
            href="/tools/trend-script"
            className="group rounded-2xl border border-white/10 bg-[#0f0f12] p-6 transition-colors hover:border-[#B4FF00]/40"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <span className="rounded-full bg-[#B4FF00] px-2 py-0.5 text-[0.65rem] font-bold text-[#060608]">
                NEU
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white group-hover:text-[#B4FF00]">
              Trend → Script
            </h2>
            <p className="mt-2 text-sm text-white/65">
              YouTube-Trends der letzten 30 Tage → fertiges Script. 3 Credits.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-[#B4FF00]">
              Tool öffnen →
            </span>
          </Link>
        </section>

        <ToolsIndexClient />
      </div>
    </div>
  );
}
