"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import {
  PRODUCTION_PATHS,
  resolveToolRoute,
} from "@/components/dashboard/core/production-tool-routes";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const copy = LANDING_V2_COPY.paths;

const pathRouteById = Object.fromEntries(
  PRODUCTION_PATHS.map((path) => [path.id, path.primaryToolId])
) as Record<string, (typeof PRODUCTION_PATHS)[number]["primaryToolId"]>;

export function LandingV2ProductionPaths() {
  const sectionRef = useRef<HTMLElement>(null);
  useSectionDramaturgy(sectionRef);

  return (
    <section
      id="paths"
      ref={sectionRef}
      className="landing-v2-section"
      aria-labelledby="lv2-paths-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-v2-kicker mb-3" data-lv2-eyebrow>
          <span className="landing-v2-kicker__dot" aria-hidden />
          {copy.eyebrow}
        </p>
        <h2
          id="lv2-paths-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
        >
          {copy.headlineLines.map((line) => (
            <span key={line} className="block" data-lv2-headline-line>
              {line}
            </span>
          ))}
        </h2>
        <p className="mt-3 max-w-2xl text-white/58" data-lv2-subline>
          {copy.subline}
        </p>

        <div className="landing-v2-paths-grid mt-10 flex flex-col gap-4">
          {copy.items.map((item) => {
            const toolId = pathRouteById[item.id];
            const href = toolId ? resolveToolRoute(toolId) ?? "/auth/sign-up" : "/auth/sign-up";
            return (
              <Link
                key={item.id}
                href={href}
                className="landing-v2-path-card group block"
                data-lv2-stagger
              >
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--lv2-text-muted)]">
                  {item.label}
                </p>
                <h3 className="landing-v2-headline mt-2 text-xl leading-snug md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--lv2-text-muted)] md:text-[0.95rem]">
                  {item.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--lv2-text-dark)] transition-all group-hover:gap-2 group-focus-visible:gap-2">
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
