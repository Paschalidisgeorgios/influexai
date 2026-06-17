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
  const panelsRef = useRef<HTMLDivElement>(null);
  const { reduceMotion, isMobile, enableCinematicScroll } = useLandingViewport();
  const [activeIndex, setActiveIndex] = useState(0);

  const onActiveChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useSectionDramaturgy(sectionRef);
  useScrollStoryTimeline(
    pinRef,
    panelsRef,
    STATIONS.length,
    enableCinematicScroll,
    onActiveChange
  );

  const stacked = isMobile || reduceMotion;

  return (
    <section
      id="story"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--workflow landing-v2-section--editorial relative overflow-hidden"
      aria-labelledby="lv2-story-heading"
    >
      <div className="mx-auto max-w-[90rem]">
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

        {stacked ? (
          <div className="landing-v2-chapter-stack mt-12">
            {STATIONS.map((station, index) => (
              <article
                key={station.id}
                className="landing-v2-chapter-stack__item"
                aria-current={index === activeIndex ? "step" : undefined}
              >
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
        ) : (
          <div ref={pinRef} className="landing-v2-scroll-story__track landing-v2-scroll-story__track--editorial mt-14">
            <div className="landing-v2-chapter-stage grid min-h-[78vh] items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
              <nav className="landing-v2-chapter-nav" aria-label="Produktionskapitel">
                <ol className="landing-v2-chapter-nav__list">
                  {STATIONS.map((station, index) => (
                    <li
                      key={station.id}
                      className={`landing-v2-chapter-nav__item ${
                        index === activeIndex ? "landing-v2-chapter-nav__item--active" : ""
                      } ${index < activeIndex ? "landing-v2-chapter-nav__item--past" : ""}`}
                    >
                      <span className="landing-v2-chapter-nav__word">{station.chapter}</span>
                    </li>
                  ))}
                </ol>
              </nav>

              <div className="landing-v2-scroll-story__stage-3d">
                <div
                  ref={panelsRef}
                  className="landing-v2-scroll-story__panels-3d landing-v2-scroll-story__panels-3d--editorial"
                >
                  {STATIONS.map((station) => (
                    <article
                      key={station.id}
                      data-story-panel
                      className="landing-v2-scroll-story__panel landing-v2-chapter-panel landing-v2-panel-3d absolute inset-0"
                    >
                      <p className="landing-v2-chapter-panel__word">{station.chapter}</p>
                      <h3 className="landing-v2-headline landing-v2-chapter-panel__title">
                        {station.title}
                      </h3>
                      <p className="landing-v2-chapter-panel__desc">{station.description}</p>
                      <div data-story-asset className="landing-v2-chapter-panel__asset">
                        <LandingV2Placeholder
                          variant={STORY_PLACEHOLDER[station.id] ?? "studio"}
                          label={station.label}
                          aspectClassName="aspect-[16/10] min-h-[14rem] md:min-h-[16rem]"
                          className="landing-v2-placeholder--dark"
                        />
                      </div>
                    </article>
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
