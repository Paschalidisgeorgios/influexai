import Link from "next/link";
import { ContentEmailCaptureSidebar } from "@/components/content-email-capture";
import type { Guide } from "@/lib/guides/types";
import { PILLAR_META, isPillarSlug } from "@/lib/guides/pillars";
import { getRelatedGuides } from "@/lib/guides/queries";
import type { TocEntry } from "@/lib/blog/toc";

export function GuideRightSidebar({
  guide,
  toc,
}: {
  guide: Guide;
  toc: TocEntry[];
}) {
  const related = getRelatedGuides(guide.slug, 3);
  const meta = isPillarSlug(guide.slug) ? PILLAR_META[guide.slug] : null;

  return (
    <aside className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-24 space-y-6">
        {toc.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">
              In diesem Guide
            </p>
            <ul className="space-y-2 text-xs">
              {toc.slice(0, 8).map((e) => (
                <li key={e.id}>
                  <a
                    href={`#${e.id}`}
                    className="text-white/80 hover:text-[#B4FF00] line-clamp-2"
                  >
                    {e.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">
            Verwandte Guides
          </p>
          <ul className="space-y-2 text-sm">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/guides/${r.slug}`}
                  className="text-white/65 hover:text-[#B4FF00] line-clamp-2"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <ContentEmailCaptureSidebar source={`guide-${guide.slug}`} />

        <div className="rounded-xl border border-[#B4FF00]/30 bg-[#B4FF00]/5 p-5">
          <p className="font-semibold text-white text-sm">
            InfluexAI ausprobieren
          </p>
          <p className="mt-2 text-xs text-white/80">
            {meta?.ctaFeature ?? "Script Generator"} — direkt im Dashboard.
          </p>
          <Link
            href={meta?.ctaRoute ?? "/dashboard"}
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#B4FF00] py-2.5 text-xs font-semibold text-black hover:bg-[#c8ff33]"
          >
            Jetzt starten →
          </Link>
        </div>
      </div>
    </aside>
  );
}
