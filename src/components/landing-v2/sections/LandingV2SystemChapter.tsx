"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";
import { LandingV2SystemModelFlow } from "../ui/LandingV2SystemModelFlow";
import { LandingV2FlowStage } from "../ui/LandingV2FlowStage";
import { LandingV2SystemBackground } from "../ui/LandingV2SystemBackground";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { useSystemBackgroundMotion } from "../hooks/useSystemBackgroundMotion";

const copy = LANDING_V2_COPY.chapters.system;

export function LandingV2SystemChapter() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgGridRef = useRef<HTMLDivElement>(null);
  const links = useLandingV2Links();
  const isPreview = links.mode === "preview";

  useSectionDramaturgy(sectionRef);
  useSystemBackgroundMotion(
    sectionRef,
    bgGridRef,
    isPreview && links.enablePreviewMotion
  );

  return (
    <section
      id="system"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--chapter landing-v2-section--system"
      aria-labelledby="lv2-system-heading"
    >
      {isPreview ? <LandingV2SystemBackground gridRef={bgGridRef} /> : null}
      <div className="landing-v2-chapter landing-v2-chapter--system mx-auto w-full max-w-[80rem]">
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
        </div>
        {links.mode === "preview" ? (
          <LandingV2SystemModelFlow className="landing-v2-chapter__stage" />
        ) : (
          <LandingV2FlowStage variant="system" className="landing-v2-chapter__stage" />
        )}
      </div>
    </section>
  );
}
