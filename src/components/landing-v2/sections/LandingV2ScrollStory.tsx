"use client";

import { useCallback, useRef, useState } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useScrollStoryTimeline } from "../hooks/useScrollStoryTimeline";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const STATIONS = LANDING_V2_COPY.workflow.stations;
const sectionCopy = LANDING_V2_COPY.workflow;

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
      className="landing-v2-section landing-v2-section--workflow relative overflow-hidden pt-14 md:pt-20"
      aria-labelledby="lv2-story-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-v2-kicker mb-3" data-lv2-eyebrow>
          <span className="landing-v2-kicker__dot" aria-hidden />
          {sectionCopy.eyebrow}
        </p>
        <h2
          id="lv2-story-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
        >
          {sectionCopy.headlineLines.map((line) => (
            <span key={line} className="block" data-lv2-headline-line>
              {line}
            </span>
          ))}
        </h2>
        <p className="mt-3 max-w-2xl text-white/58" data-lv2-subline>
          {sectionCopy.subline}
        </p>

        {stacked ? (
          <div className="mt-10 space-y-4">
            {STATIONS.map((station, index) => (
              <article
                key={station.id}
                className="landing-v2-ivory-stage p-6"
                aria-current={index === activeIndex ? "step" : undefined}
              >
                <p className="landing-v2-kicker mb-2 !text-[var(--lv2-text-muted)]">
                  <span className="landing-v2-kicker__dot" />
                  {station.label}
                </p>
                <h3 className="landing-v2-headline text-2xl">{station.title}</h3>
                <p className="mt-2 text-[var(--lv2-text-muted)]">{station.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <div ref={pinRef} className="landing-v2-scroll-story__track mt-12">
            <div className="grid min-h-[72vh] items-center gap-10 lg:grid-cols-[220px_1fr]">
              <ol className="space-y-2" aria-label="Produktionsstationen">
                {STATIONS.map((station, index) => (
                  <li
                    key={station.id}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
                      index === activeIndex
                        ? "bg-[var(--lv2-lime-soft)] text-[var(--lv2-lime)]"
                        : "text-white/45"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        index === activeIndex ? "bg-[var(--lv2-lime)]" : "bg-white/25"
                      }`}
                      aria-hidden
                    />
                    {station.label}
                  </li>
                ))}
              </ol>

              <div className="landing-v2-scroll-story__stage-3d">
                <div
                  ref={panelsRef}
                  className="landing-v2-scroll-story__panels-3d"
                >
                  {STATIONS.map((station) => (
                    <article
                      key={station.id}
                      data-story-panel
                      className="landing-v2-scroll-story__panel landing-v2-ivory-stage landing-v2-panel-3d absolute inset-0 p-8 md:p-10"
                    >
                      <p className="landing-v2-kicker mb-3 !text-[var(--lv2-text-muted)]">
                        <span className="landing-v2-kicker__dot" />
                        {station.label}
                      </p>
                      <h3 className="landing-v2-headline text-[clamp(1.75rem,3vw,2.5rem)]">
                        {station.title}
                      </h3>
                      <p className="mt-3 max-w-lg text-[var(--lv2-text-muted)]">
                        {station.description}
                      </p>
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
