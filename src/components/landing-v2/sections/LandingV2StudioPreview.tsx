"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { useStudio3DScene } from "../hooks/useStudio3DScene";

const copy = LANDING_V2_COPY.studio;
const chapterCopy = LANDING_V2_COPY.chapters.studio;

const MODULES = copy.panels.map((panel, index) => ({
  ...panel,
  index: String(index + 1).padStart(2, "0"),
  region: ["cockpit", "agent", "tools", "gallery"][index] ?? "cockpit",
}));

export function LandingV2StudioPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const { isMobile, reduceMotion, enableCinematicScroll } = useLandingViewport();
  const { enablePreviewMotion } = useLandingV2Links();

  useSectionDramaturgy(sectionRef);
  useStudio3DScene(sectionRef, sceneRef, enableCinematicScroll && enablePreviewMotion && !isMobile);

  return (
    <section
      id="studio"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--editorial overflow-hidden"
      aria-labelledby="lv2-studio-heading"
    >
      <div className="mx-auto max-w-[90rem]">
        <LandingV2ChapterMarker number={chapterCopy.number} label={chapterCopy.label} />
        <h2
          id="lv2-studio-heading"
          className="landing-v2-headline landing-v2-editorial-title mt-5 text-[var(--lv2-text-light)]"
        >
          {chapterCopy.headlineLines.map((line) => (
            <span key={line} className="block" data-lv2-headline-line>
              {line}
            </span>
          ))}
        </h2>
        <p className="landing-v2-editorial-lead mt-4 max-w-2xl" data-lv2-subline>
          {chapterCopy.body}
        </p>

        <div
          ref={sceneRef}
          className={`landing-v2-studio-map mt-12 md:mt-16 ${
            enableCinematicScroll && !isMobile && !reduceMotion ? "landing-v2-scene-3d" : ""
          }`}
          data-lv2-stagger
        >
          <svg
            className="landing-v2-studio-map__lines"
            viewBox="0 0 1000 520"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M 180 130 L 500 130 L 820 130 L 820 390 L 180 390 L 180 130"
              className="landing-v2-studio-map__path"
            />
            <path d="M 500 130 L 500 390" className="landing-v2-studio-map__path landing-v2-studio-map__path--inner" />
          </svg>

          <ul className="landing-v2-studio-map__regions">
            {MODULES.map((module) => (
              <li
                key={module.id}
                data-studio-panel
                className={`landing-v2-studio-map__region landing-v2-studio-map__region--${module.region} landing-v2-panel-3d`}
              >
                <span className="landing-v2-studio-map__region-index">{module.index}</span>
                <p className="landing-v2-studio-map__region-label">{module.label}</p>
                <h3 className="landing-v2-headline landing-v2-studio-map__region-title">
                  {module.title}
                </h3>
                <p className="landing-v2-studio-map__region-desc">{module.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
