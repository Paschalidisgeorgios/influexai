"use client";

import { useCallback, useRef, useState } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2WorkflowStage } from "../ui/LandingV2WorkflowStage";
import type { StudioSurfaceVariant } from "../ui/LandingV2StudioSurface";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useScrollStoryActiveChapter } from "../hooks/useScrollStoryActiveChapter";
import { useWorkflowStageMotion } from "../hooks/useWorkflowStageMotion";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";

const STATIONS = LANDING_V2_COPY.workflow.stations;
const sectionCopy = LANDING_V2_COPY.workflow;
const chapterCopy = LANDING_V2_COPY.chapters.workflow;

const SURFACE_VARIANT: Record<string, StudioSurfaceVariant> = {
  briefing: "briefing",
  path: "path",
  image: "image",
  motion: "motion",
  gallery: "gallery",
};

export function LandingV2ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const chaptersRef = useRef<HTMLDivElement>(null);
  const { reduceMotion, isMobile, enableCinematicScroll } = useLandingViewport();
  const { enablePreviewMotion } = useLandingV2Links();
  const [activeIndex, setActiveIndex] = useState(0);

  const onActiveChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const useChapterTracking = enableCinematicScroll && !isMobile && !reduceMotion;

  useSectionDramaturgy(sectionRef);
  useScrollStoryActiveChapter(chaptersRef, useChapterTracking, onActiveChange);
  useWorkflowStageMotion(chaptersRef, enableCinematicScroll && enablePreviewMotion);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--workflow landing-v2-section--editorial landing-v2-scroll-story"
      aria-labelledby="lv2-story-heading"
    >
      <div className="mx-auto max-w-[90rem]">
        <div ref={introRef} className="landing-v2-workflow-intro">
          <LandingV2ChapterMarker number={chapterCopy.number} label={chapterCopy.label} />
          <h2
            id="lv2-story-heading"
            className="landing-v2-headline landing-v2-editorial-title mt-5 text-[var(--lv2-text-light)]"
          >
            {chapterCopy.headlineLines.map((line) => (
              <span key={line} className="block" data-lv2-headline-line>
                {line}
              </span>
            ))}
          </h2>
          <p className="landing-v2-editorial-lead mt-4 max-w-2xl text-white/55" data-lv2-subline>
            {chapterCopy.body}
          </p>
          <p className="landing-v2-workflow-steps mt-5" data-lv2-eyebrow>
            {sectionCopy.steps}
          </p>
        </div>

        <div className="landing-v2-workflow-body">
          {useChapterTracking ? (
            <aside className="landing-v2-workflow-nav" aria-label="Produktionskapitel">
              <ol className="landing-v2-workflow-nav__list">
                {STATIONS.map((station, index) => (
                  <li
                    key={station.id}
                    className={`landing-v2-workflow-nav__item ${
                      index === activeIndex ? "landing-v2-workflow-nav__item--active" : ""
                    } ${index < activeIndex ? "landing-v2-workflow-nav__item--past" : ""}`}
                    aria-current={index === activeIndex ? "step" : undefined}
                  >
                    <span className="landing-v2-workflow-nav__line" aria-hidden />
                    <span className="landing-v2-workflow-nav__word">{station.chapter}</span>
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}

          <div ref={chaptersRef} className="landing-v2-workflow-chapters">
            {STATIONS.map((station, index) => (
              <article
                key={station.id}
                data-chapter-step
                className={`landing-v2-workflow-chapter ${
                  index === activeIndex ? "landing-v2-workflow-chapter--active" : ""
                }`}
                aria-current={index === activeIndex ? "step" : undefined}
              >
                <div className="landing-v2-workflow-chapter__copy">
                  <p className="landing-v2-workflow-chapter__word">{station.chapter}</p>
                  <h3 className="landing-v2-headline landing-v2-workflow-chapter__title">
                    {station.title}
                  </h3>
                  <p className="landing-v2-workflow-chapter__desc">{station.description}</p>
                </div>
                <LandingV2WorkflowStage
                  chapter={station.chapter}
                  label={station.label}
                  stageLabel={station.stageLabel}
                  stageStatus={station.stageStatus}
                  surfaceVariant={SURFACE_VARIANT[station.id] ?? "briefing"}
                  step={index + 1}
                  total={STATIONS.length}
                  isActive={index === activeIndex}
                />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
