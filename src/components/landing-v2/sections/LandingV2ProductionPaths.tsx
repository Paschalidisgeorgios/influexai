"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import {
  PRODUCTION_PATHS,
  resolveToolRoute,
} from "@/components/dashboard/core/production-tool-routes";
import { PRODUCTION_PATH_PURPOSE } from "@/lib/landing-v2-assets";
import { useLandingReveal } from "../hooks/useLandingReveal";

export function LandingV2ProductionPaths() {
  const sectionRef = useRef<HTMLElement>(null);
  useLandingReveal(sectionRef);

  return (
    <section
      id="paths"
      ref={sectionRef}
      className="landing-v2-section"
      aria-labelledby="lv2-paths-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-v2-kicker mb-3" data-lv2-reveal>
          <span className="landing-v2-kicker__dot" aria-hidden />
          Produktionspfade
        </p>
        <h2
          id="lv2-paths-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
          data-lv2-reveal
        >
          Drei Wege. Ein Studio.
        </h2>
        <p className="mt-3 max-w-2xl text-white/58" data-lv2-reveal>
          Keine Tool-Liste — klare Produktionswege für Bild, Motion und Kampagne.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PRODUCTION_PATHS.map((path) => {
            const href = resolveToolRoute(path.primaryToolId) ?? "/auth/sign-up";
            const purpose = PRODUCTION_PATH_PURPOSE[path.id] ?? path.description;
            return (
              <Link
                key={path.id}
                href={href}
                className="landing-v2-path-card group block"
                data-lv2-reveal
              >
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--lv2-text-muted)]">
                  Produktionspfad
                </p>
                <h3 className="landing-v2-headline mt-2 text-2xl">{path.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lv2-text-muted)]">
                  {purpose}
                </p>
                <ul className="mt-4 space-y-1 text-sm text-[var(--lv2-text-dark)]/80">
                  {path.options.map((opt) => (
                    <li key={opt.id} className="flex items-center gap-2">
                      <span
                        className="h-1 w-1 shrink-0 rounded-full bg-[var(--lv2-lime)]"
                        aria-hidden
                      />
                      {opt.label}
                    </li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--lv2-text-dark)] transition-all group-hover:gap-2">
                  Pfad öffnen
                  <ArrowRight size={16} aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
