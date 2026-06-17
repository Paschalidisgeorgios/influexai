"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";
import { LandingV2StudioProductScenes } from "../ui/LandingV2StudioProductScenes";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { useStudioScenesReveal } from "../hooks/useStudioScenesReveal";

const chapterCopy = LANDING_V2_COPY.chapters.studio;

export function LandingV2StudioPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const { enablePreviewMotion } = useLandingV2Links();

  useSectionDramaturgy(sectionRef);
  useStudioScenesReveal(sceneRef, enablePreviewMotion);

  return (
    <section
      id="studio"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--chapter landing-v2-section--studio overflow-hidden"
      aria-labelledby="lv2-studio-heading"
    >
      <div className="landing-v2-chapter mx-auto w-full max-w-[90rem]">
        <LandingV2ChapterMarker number={chapterCopy.number} label={chapterCopy.label} />
        <div className="landing-v2-chapter__intro">
          <h2
            id="lv2-studio-heading"
            className="landing-v2-headline landing-v2-editorial-title landing-v2-chapter__headline"
          >
            {chapterCopy.headlineLines.map((line) => (
              <span key={line} className="block" data-lv2-headline-line>
                {line}
              </span>
            ))}
          </h2>
          <p className="landing-v2-editorial-lead landing-v2-chapter__lead max-w-2xl" data-lv2-subline>
            {chapterCopy.body}
          </p>
        </div>

        <div ref={sceneRef} className="landing-v2-chapter__stage" data-lv2-stagger>
          <LandingV2StudioProductScenes />
        </div>
      </div>
    </section>
  );
}
