"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";
import { LandingV2CreatorProductionFlow } from "../ui/LandingV2CreatorProductionFlow";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const chapterCopy = LANDING_V2_COPY.chapters.workflow;

export function LandingV2ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);

  useSectionDramaturgy(sectionRef);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--chapter landing-v2-section--workflow landing-v2-scroll-story landing-v2-section--media-stage"
      aria-labelledby="lv2-story-heading"
    >
      <div className="landing-v2-chapter mx-auto w-full max-w-[90rem]">
        <LandingV2ChapterMarker number={chapterCopy.number} label={chapterCopy.label} />
        <div className="landing-v2-chapter__intro">
          <h2
            id="lv2-story-heading"
            className="landing-v2-headline landing-v2-editorial-title landing-v2-chapter__headline"
          >
            {chapterCopy.headlineLines.map((line) => (
              <span key={line} className="block" data-lv2-headline-line>
                {line}
              </span>
            ))}
          </h2>
          <p className="landing-v2-editorial-lead landing-v2-chapter__lead" data-lv2-subline>
            {chapterCopy.body}
          </p>
          <p className="landing-v2-workflow-steps mt-6">{chapterCopy.steps}</p>
        </div>

        <div className="landing-v2-chapter__flow-panel">
          <LandingV2CreatorProductionFlow
            variant="workflow"
            className="landing-v2-chapter__flow-stage"
          />
        </div>
      </div>
    </section>
  );
}
