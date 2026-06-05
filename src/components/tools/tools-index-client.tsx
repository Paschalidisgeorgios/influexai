"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FEATURES,
  NICHES,
  TOP_NICHES,
  toolPagePath,
  type FeatureKey,
  type NicheKey,
} from "@/lib/programmatic-seo";

export function ToolsIndexClient() {
  const [query, setQuery] = useState("");

  const filteredNiches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    return (Object.entries(NICHES) as [NicheKey, (typeof NICHES)[NicheKey]][])
      .filter(
        ([key, n]) =>
          key.includes(q) ||
          n.nameDe.toLowerCase().includes(q) ||
          n.name.toLowerCase().includes(q)
      )
      .map(([key]) => key);
  }, [query]);

  const allNicheKeys = Object.keys(NICHES) as NicheKey[];
  const featureKeys = Object.keys(FEATURES) as FeatureKey[];

  return (
    <div>
      <div className="mb-10">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nische suchen (z. B. fitness, gaming, kochen…)"
          className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 focus:border-[#B4FF00]/50 focus:outline-none"
        />
      </div>

      {filteredNiches && filteredNiches.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-medium text-white">
            Suchergebnisse ({filteredNiches.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {filteredNiches.map((niche) => (
              <Link
                key={niche}
                href={toolPagePath("script-generator", niche)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:border-[#B4FF00]/40 hover:text-[#B4FF00]"
              >
                {NICHES[niche].emoji} {NICHES[niche].nameDe}
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredNiches && filteredNiches.length === 0 && query && (
        <p className="mb-8 text-sm text-white/70">Keine Nische gefunden.</p>
      )}

      <section className="mb-14 overflow-x-auto">
        <h2 className="mb-4 text-lg font-medium text-white">
          Beliebte Nischen × Tools
        </h2>
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-white/10 bg-white/5 p-3 text-left text-white/80">
                Tool
              </th>
              {TOP_NICHES.map((niche) => (
                <th
                  key={niche}
                  className="border border-white/10 bg-white/5 p-2 text-center text-xs font-normal text-white/80"
                >
                  {NICHES[niche].emoji}
                  <br />
                  {NICHES[niche].nameDe}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureKeys.map((feature) => (
              <tr key={feature}>
                <td className="border border-white/10 p-3 font-medium text-white/80">
                  {FEATURES[feature].nameDe}
                </td>
                {TOP_NICHES.map((niche) => (
                  <td
                    key={niche}
                    className="border border-white/10 p-2 text-center"
                  >
                    <Link
                      href={toolPagePath(feature, niche)}
                      className="text-[#B4FF00] hover:underline"
                      title={`${FEATURES[feature].nameDe} für ${NICHES[niche].nameDe}`}
                    >
                      →
                    </Link>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-white">
          Deine Nische nicht dabei?
        </h2>
        <p className="mb-4 text-sm text-white/80">
          Wähle aus {allNicheKeys.length} Nischen und {featureKeys.length} Tools
          — über {allNicheKeys.length * featureKeys.length} Landingpages.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {allNicheKeys.map((niche) => (
            <Link
              key={niche}
              href={toolPagePath("script-generator", niche)}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80 transition-colors hover:border-[#B4FF00]/30 hover:text-[#B4FF00]"
            >
              {NICHES[niche].emoji} {NICHES[niche].nameDe}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
