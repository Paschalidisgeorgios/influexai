"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCROLL_STORY_STATIONS } from "@/lib/landing-v2-assets";
import { useReducedMotion } from "../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export function LandingV2ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const panels = panelsRef.current;
    if (!section || !pin || !panels || reduceMotion || isMobile) return;

    const panelEls = panels.querySelectorAll<HTMLElement>("[data-story-panel]");

    const ctx = gsap.context(() => {
      gsap.set(panelEls, { autoAlpha: 0, y: 24 });
      gsap.set(panelEls[0], { autoAlpha: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${SCROLL_STORY_STATIONS.length * 55}%`,
          pin: pin,
          scrub: 0.55,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(
              SCROLL_STORY_STATIONS.length - 1,
              Math.floor(self.progress * SCROLL_STORY_STATIONS.length)
            );
            setActiveIndex(idx);
          },
        },
      });

      panelEls.forEach((panel, index) => {
        if (index === 0) return;
        tl.to(
          panelEls[index - 1],
          { autoAlpha: 0, y: -16, duration: 0.35, ease: "power1.inOut" },
          index * 0.2
        ).to(
          panel,
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
          index * 0.2 + 0.05
        );
      });
    }, section);

    return () => ctx.revert();
  }, [reduceMotion, isMobile]);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="landing-v2-section relative"
      aria-labelledby="lv2-story-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-v2-kicker mb-3">
          <span className="landing-v2-kicker__dot" aria-hidden />
          Workflow
        </p>
        <h2
          id="lv2-story-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
        >
          Vom Briefing zum Asset
        </h2>
        <p className="mt-3 max-w-2xl text-white/58">
          Briefing, Bild, Video und Galerie in einem Workflow — nicht als lose Tool-Kette.
        </p>

        {isMobile || reduceMotion ? (
          <div className="mt-10 space-y-4">
            {SCROLL_STORY_STATIONS.map((station, index) => (
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
            <div className="grid min-h-[70vh] items-center gap-10 lg:grid-cols-[220px_1fr]">
              <ol className="space-y-2" aria-label="Produktionsstationen">
                {SCROLL_STORY_STATIONS.map((station, index) => (
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

              <div ref={panelsRef} className="relative min-h-[280px]">
                {SCROLL_STORY_STATIONS.map((station) => (
                  <article
                    key={station.id}
                    data-story-panel
                    className="landing-v2-scroll-story__panel landing-v2-ivory-stage absolute inset-0 p-8 md:p-10"
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
        )}
      </div>
    </section>
  );
}
