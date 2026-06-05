"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/blog/toc";

export function ArticleToc({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");

  useEffect(() => {
    if (!entries.length) return;

    const observer = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    for (const e of entries) {
      const el = document.getElementById(e.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [entries]);

  if (!entries.length) return null;

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">
          Inhalt
        </p>
        <ul className="space-y-2 text-sm">
          {entries.map((e) => (
            <li key={e.id} className={e.level === 3 ? "pl-3" : ""}>
              <a
                href={`#${e.id}`}
                className={`block transition-colors ${
                  activeId === e.id
                    ? "text-[#B4FF00]"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {e.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
