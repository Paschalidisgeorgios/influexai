"use client";

import { useCallback, useRef, useState } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2Placeholder } from "../ui/LandingV2Placeholder";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useScrollStoryTimeline } from "../hooks/useScrollStoryTimeline";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const STATIONS = LANDING_V2_COPY.workflow.stations;
const sectionCopy = LANDING_V2_COPY.workflow;

const STORY_PLACEHOLDER: Record<string, "studio" | "tools" | "campaign-visual" | "motion-draft" | "gallery"> = {
  briefing: "studio",
  path: "tools",
  image: "campaign-visual",
  motion: "motion-draft",
  gallery: "gallery",
};

export function LandingV2ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const { reduceMotion, isMobile, enableCinematicScroll } = useLandingViewport();
  const [activeIndex, setActiveIndex] = useState(0);

  const onActiveChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const activeStation = STATIONS[activeIndex] ?? STATIONS[0];
  const stacked = isMobile || reduceMotion;

  useSectionDramaturgy(stacked ? sectionRef : introRef);
  useScrollStoryTimeline(
    pinRef,
    stageRef,
    STATIONS.length,
    enableCinematicScroll,
    onActiveChange
  );

  return (
    <section
      id="story"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--workflow landing-v2-section--editorial landing-v2-scroll-story relative"
      aria-labelledby="lv2-story-heading"
    >
      <div className="mx-auto max-w-[90rem]">
        {stacked ? (
          <>
            <div ref={introRef}>
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
            <div className="landing-v2-chapter-stack mt-12">
              {STATIONS.map((station) => (
                <article key={station.id} className="landing-v2-chapter-stack__item">
                  <p className="landing-v2-chapter-stack__word">{station.chapter}</p>
                  <h3 className="landing-v2-headline mt-2 text-2xl">{station.title}</h3>
                  <p className="mt-3 text-white/55">{station.description}</p>
                  <div className="mt-5">
                    <LandingV2Placeholder
                      variant={STORY_PLACEHOLDER[station.id] ?? "studio"}
                      label={station.label}
                      aspectClassName="aspect-[16/10] min-h-[11rem]"
                      className="landing-v2-placeholder--dark"
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div ref={pinRef} className="landing-v2-scroll-story__track landing-v2-scroll-story__track--stable">
            <div className="landing-v2-chapter-stage grid min-h-[min(100vh,820px)] gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14 lg:items-start">
              <div className="landing-v2-chapter-sidebar min-w-0">
                <div ref={introRef} className="landing-v2-chapter-sidebar__intro">
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
                  <p className="landing-v2-editorial-lead mt-4 max-w-xl text-white/55" data-lv2-subline>
                    {sectionCopy.subline}
                  </p>
                </div>

                <nav className="landing-v2-chapter-nav mt-10" aria-label="Produktionskapitel">
                  <ol className="landing-v2-chapter-nav__list">
                    {STATIONS.map((station, index) => (
                      <li
                        key={station.id}
                        className={`landing-v2-chapter-nav__item ${
                          index === activeIndex ? "landing-v2-chapter-nav__item--active" : ""
                        } ${index < activeIndex ? "landing-v2-chapter-nav__item--past" : ""}`}
                        aria-current={index === activeIndex ? "step" : undefined}
                      >
                        <span className="landing-v2-chapter-nav__word">{station.chapter}</span>
                      </li>
                    ))}
                  </ol>
                </nav>

                <div
                  className="landing-v2-chapter-active mt-10"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <p className="landing-v2-chapter-active__word">{activeStation.chapter}</p>
                  <h3 className="landing-v2-headline landing-v2-chapter-active__title">
                    {activeStation.title}
                  </h3>
                  <p className="landing-v2-chapter-active__desc">{activeStation.description}</p>
                </div>
              </div>

              <div className="landing-v2-scroll-story__stage-3d landing-v2-scroll-story__stage-3d--stable min-w-0">
                <div
                  ref={stageRef}
                  className="landing-v2-scroll-story__asset-stage"
                >
                  {STATIONS.map((station, index) => (
                    <div
                      key={station.id}
                      data-story-asset-panel
                      className={`landing-v2-scroll-story__asset-panel landing-v2-panel-3d ${
                        index === 0 ? "landing-v2-scroll-story__asset-panel--active" : ""
                      }`}
                      aria-hidden={index !== activeIndex}
                    >
                      <LandingV2Placeholder
                        variant={STORY_PLACEHOLDER[station.id] ?? "studio"}
                        label={station.label}
                        aspectClassName="aspect-[16/10] min-h-[14rem] md:min-h-[18rem] lg:min-h-[20rem]"
                        className="landing-v2-placeholder--dark h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
