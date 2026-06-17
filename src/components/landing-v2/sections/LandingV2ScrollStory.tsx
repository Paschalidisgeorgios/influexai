"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";
import { LandingV2EditorialVideo } from "../ui/LandingV2EditorialVideo";
import { LandingV2CreatorProductionFlow } from "../ui/LandingV2CreatorProductionFlow";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { useEditorialVideoScroll } from "../hooks/useEditorialVideoScroll";

const chapterCopy = LANDING_V2_COPY.chapters.workflow;

export function LandingV2ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoStageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isMobile, enableCinematicScroll } = useLandingViewport();
  const { enablePreviewMotion, enableHeroVideo } = useLandingV2Links();

  useSectionDramaturgy(sectionRef);
  useEditorialVideoScroll({
    sectionRef,
    stageRef: videoStageRef,
    videoRef,
    enabled: enablePreviewMotion && enableCinematicScroll && !isMobile,
  });

  return (
    <section
      id="story"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--chapter landing-v2-section--workflow landing-v2-scroll-story"
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

        <div ref={videoStageRef} className="landing-v2-chapter__video-stage">
          <LandingV2EditorialVideo ref={videoRef} enabled={enableHeroVideo} />
          <div className="landing-v2-chapter__video-scrim" aria-hidden />
          <LandingV2CreatorProductionFlow
            variant="workflow"
            className="landing-v2-chapter__flow-overlay"
          />
        </div>
      </div>
    </section>
  );
}
