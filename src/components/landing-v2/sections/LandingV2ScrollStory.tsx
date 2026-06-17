"use client";

import { useCallback, useRef, useState } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2WorkflowStage } from "../ui/LandingV2WorkflowStage";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useScrollStoryActiveChapter } from "../hooks/useScrollStoryActiveChapter";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const STATIONS = LANDING_V2_COPY.workflow.stations;
const sectionCopy = LANDING_V2_COPY.workflow;

const STORY_PLACEHOLDER: Record<
  string,
  "studio" | "tools" | "campaign-visual" | "motion-draft" | "gallery"
> = {
  briefing: "studio",
  path: "tools",
  image: "campaign-visual",
  motion: "motion-draft",
  gallery: "gallery",
};

export function LandingV2ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const chaptersRef = useRef<HTMLDivElement>(null);
  const { reduceMotion, isMobile, enableCinematicScroll } = useLandingViewport();
  const [activeIndex, setActiveIndex] = useState(0);

  const onActiveChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const useChapterTracking = enableCinematicScroll && !isMobile && !reduceMotion;

  useSectionDramaturgy(sectionRef);
  useScrollStoryActiveChapter(chaptersRef, useChapterTracking, onActiveChange);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--workflow landing-v2-section--editorial landing-v2-scroll-story"
      aria-labelledby="lv2-story-heading"
    >
      <div className="mx-auto max-w-[90rem]">
        <div ref={introRef} className="landing-v2-workflow-intro">
          <p className="landing-v2-kicker mb-4" data-lv2-eyebrow>
            <span className="landing-v2-kicker__dot" aria-hidden />
            {sectionCopy.eyebrow}
          </p>
          <h2
            id="lv2-story-heading"
            className="landing-v2-headline landing-v2-editorial-title text-[var(--lv2-text-light)]"
          >
            {sectionCopy.headlineLines.map((line) => (
              <span key={line} className="block" data-lv2-headline-line>
                {line}
              </span>
            ))}
          </h2>
          <p className="landing-v2-editorial-lead mt-4 max-w-2xl text-white/55" data-lv2-subline>
            {sectionCopy.subline}
          </p>
        </div>

        <div className="landing-v2-workflow-body mt-12 md:mt-14">
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
                  step={index + 1}
                  total={STATIONS.length}
                  placeholderVariant={STORY_PLACEHOLDER[station.id] ?? "studio"}
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
