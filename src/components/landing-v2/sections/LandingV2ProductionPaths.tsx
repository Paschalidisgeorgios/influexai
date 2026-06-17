"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import {
  PRODUCTION_PATHS,
  resolveToolRoute,
} from "@/components/dashboard/core/production-tool-routes";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingReveal } from "../hooks/useLandingReveal";

const copy = LANDING_V2_COPY.paths;

const pathRouteById = Object.fromEntries(
  PRODUCTION_PATHS.map((path) => [path.id, path.primaryToolId])
) as Record<string, (typeof PRODUCTION_PATHS)[number]["primaryToolId"]>;

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
          {copy.eyebrow}
        </p>
        <h2
          id="lv2-paths-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
          data-lv2-reveal
        >
          {copy.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-white/58" data-lv2-reveal>
          {copy.subline}
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {copy.items.map((item) => {
            const toolId = pathRouteById[item.id];
            const href = toolId ? resolveToolRoute(toolId) ?? "/auth/sign-up" : "/auth/sign-up";
            return (
              <Link
                key={item.id}
                href={href}
                className="landing-v2-path-card group block"
                data-lv2-reveal
              >
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--lv2-text-muted)]">
                  {item.label}
                </p>
                <h3 className="landing-v2-headline mt-2 text-xl leading-snug">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lv2-text-muted)]">
                  {item.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--lv2-text-dark)] transition-all group-hover:gap-2">
                  {item.cta}
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
