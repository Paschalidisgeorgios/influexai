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
        <ToolsIndexClient />
      </div>
    </div>
  );
}
