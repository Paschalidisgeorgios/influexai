"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/blog/toc";

export function GuideTocSidebar({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!entries.length) return;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };

    const observer = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 }
    );

    for (const e of entries) {
      const el = document.getElementById(e.id);
      if (el) observer.observe(el);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [entries]);

  if (!entries.length) return null;

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24 rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-[#B4FF00] transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
          Inhalt
        </p>
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto text-sm">
          {entries.map((e) => (
            <li key={e.id} className={e.level === 3 ? "pl-3" : ""}>
              <a
                href={`#${e.id}`}
                className={`block transition-colors ${
                  activeId === e.id
                    ? "text-[#B4FF00]"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {e.title}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mt-4 w-full rounded-lg border border-white/10 py-2 text-xs text-white/50 hover:border-[#B4FF00]/40 hover:text-[#B4FF00]"
        >
          Zurück nach oben
        </button>
      </div>
    </aside>
  );
}
