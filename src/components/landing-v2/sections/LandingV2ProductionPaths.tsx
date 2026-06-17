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
import { useProductionPathsReveal } from "../hooks/useProductionPathsReveal";
import { useLandingViewport } from "../hooks/useLandingViewport";

const copy = LANDING_V2_COPY.paths;

const pathRouteById = Object.fromEntries(
  PRODUCTION_PATHS.map((path) => [path.id, path.primaryToolId])
) as Record<string, (typeof PRODUCTION_PATHS)[number]["primaryToolId"]>;

export function LandingV2ProductionPaths() {
  const sectionRef = useRef<HTMLElement>(null);
  const { enableCinematicScroll } = useLandingViewport();
  useSectionDramaturgy(sectionRef);
  useProductionPathsReveal(sectionRef, enableCinematicScroll);

  return (
    <section
      id="paths"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--editorial landing-v2-section--after-story"
      aria-labelledby="lv2-paths-heading"
    >
      <div className="mx-auto max-w-[90rem]">
        <p className="landing-v2-kicker mb-4" data-lv2-eyebrow>
          <span className="landing-v2-kicker__dot" aria-hidden />
          {copy.eyebrow}
        </p>
        <h2
          id="lv2-paths-heading"
          className="landing-v2-headline landing-v2-editorial-title text-[var(--lv2-text-light)]"
        >
          {copy.headlineLines.map((line) => (
            <span key={line} className="block" data-lv2-headline-line>
              {line}
            </span>
          ))}
        </h2>
        <p className="landing-v2-editorial-lead mt-4 max-w-xl text-white/55" data-lv2-subline>
          {copy.subline}
        </p>

        <div className="landing-v2-editorial-paths mt-12 md:mt-16">
          {copy.items.map((item) => {
            const toolId = pathRouteById[item.id];
            const href = toolId ? resolveToolRoute(toolId) ?? "/auth/sign-up" : "/auth/sign-up";
            return (
              <Link
                key={item.id}
                href={href}
                className="landing-v2-editorial-path group"
              >
                <div className="landing-v2-editorial-path__inner">
                  <p className="landing-v2-editorial-path__label">{item.label}</p>
                  <h3 className="landing-v2-headline landing-v2-editorial-path__title">
                    {item.title}
                  </h3>
                  <p className="landing-v2-editorial-path__desc">{item.description}</p>
                  <span className="landing-v2-editorial-path__cta">
                    {item.cta}
                    <ArrowRight size={16} aria-hidden />
                  </span>
                </div>
                <span className="landing-v2-editorial-path__line" aria-hidden />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
