"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { useProductionPathsReveal } from "../hooks/useProductionPathsReveal";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";

const copy = LANDING_V2_COPY.paths;
const chapterCopy = LANDING_V2_COPY.chapters.paths;

const LANDING_PRODUCTION_PATHS = [
  {
    key: "image",
    label: "Bild erstellen",
    href: "/dashboard?tool=image-gen",
  },
  {
    key: "video",
    label: "Video erstellen",
    href: "/dashboard?tool=img-to-video",
  },
  {
    key: "campaign",
    label: "Kampagne planen",
    href: "/dashboard?tool=content-calendar",
  },
] as const;

const pathHrefByKey: Record<string, string> = Object.fromEntries(
  LANDING_PRODUCTION_PATHS.map((path) => [path.key, path.href])
);

export function LandingV2ProductionPaths() {
  const sectionRef = useRef<HTMLElement>(null);
  const { enableCinematicScroll } = useLandingViewport();
  const { enablePreviewMotion } = useLandingV2Links();
  useSectionDramaturgy(sectionRef);
  useProductionPathsReveal(sectionRef, enableCinematicScroll && enablePreviewMotion);

  return (
    <section
      id="paths"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--chapter landing-v2-section--paths"
      aria-labelledby="lv2-paths-heading"
    >
      <div className="landing-v2-chapter mx-auto w-full max-w-[90rem]">
        <LandingV2ChapterMarker number={chapterCopy.number} label={chapterCopy.label} />
        <div className="landing-v2-chapter__intro">
          <h2
            id="lv2-paths-heading"
            className="landing-v2-headline landing-v2-editorial-title landing-v2-chapter__headline"
          >
            {chapterCopy.headlineLines.map((line) => (
              <span key={line} className="block" data-lv2-headline-line>
                {line}
              </span>
            ))}
          </h2>
          <p className="landing-v2-editorial-lead landing-v2-chapter__lead max-w-xl" data-lv2-subline>
            {chapterCopy.body}
          </p>
        </div>

        <div className="landing-v2-path-tracks landing-v2-chapter__stage">
          {copy.items.map((item) => (
              <Link
                key={item.id}
                href={pathHrefByKey[item.id] ?? "/auth/sign-up"}
                className="landing-v2-path-track group"
                data-lv2-stagger
              >
                <span className="landing-v2-path-track__index">{item.index}</span>
                <div className="landing-v2-path-track__body">
                  <p className="landing-v2-path-track__label">{item.label}</p>
                  <p className="landing-v2-path-track__hint">{item.title}</p>
                </div>
                <span className="landing-v2-path-track__cta">
                  {item.cta}
                  <ArrowRight size={16} aria-hidden />
                </span>
                <span className="landing-v2-path-track__line" aria-hidden />
              </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
