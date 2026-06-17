"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";
import { LandingV2FlowStage } from "../ui/LandingV2FlowStage";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const copy = LANDING_V2_COPY.chapters.system;

export function LandingV2SystemChapter() {
  const sectionRef = useRef<HTMLElement>(null);
  useSectionDramaturgy(sectionRef);

  return (
    <section
      id="system"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--chapter landing-v2-section--system"
      aria-labelledby="lv2-system-heading"
    >
      <div className="landing-v2-chapter mx-auto w-full max-w-[90rem]">
        <LandingV2ChapterMarker number={copy.number} label={copy.label} />
        <div className="landing-v2-chapter__intro">
          <h2
            id="lv2-system-heading"
            className="landing-v2-headline landing-v2-editorial-title landing-v2-chapter__headline"
          >
            <span className="block" data-lv2-headline-line>
              {copy.headline}
            </span>
          </h2>
          <p className="landing-v2-editorial-lead landing-v2-chapter__lead" data-lv2-subline>
            {copy.body}
          </p>
          <p className="landing-v2-workflow-steps mt-6">{copy.flow}</p>
        </div>
        <LandingV2FlowStage variant="system" className="landing-v2-chapter__stage" />
      </div>
    </section>
  );
}
