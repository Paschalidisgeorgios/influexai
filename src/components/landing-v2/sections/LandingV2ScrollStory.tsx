"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";

const STATIONS = LANDING_V2_COPY.workflow.stations;
const sectionCopy = LANDING_V2_COPY.workflow;
import { useLandingViewport } from "../hooks/useLandingViewport";

gsap.registerPlugin(ScrollTrigger);

const PANEL_DEPTH = [
  { enterZ: 90, activeZ: 0, exitZ: -110, enterRotX: 7, exitRotX: -5 },
  { enterZ: 85, activeZ: 0, exitZ: -105, enterRotX: 6, exitRotX: -4 },
  { enterZ: 95, activeZ: 0, exitZ: -115, enterRotX: 8, exitRotX: -6 },
  { enterZ: 88, activeZ: 0, exitZ: -108, enterRotX: 7, exitRotX: -5 },
  { enterZ: 92, activeZ: 0, exitZ: -112, enterRotX: 6, exitRotX: -4 },
] as const;

export function LandingV2ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const { reduceMotion, isMobile, enable3D } = useLandingViewport();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const panels = panelsRef.current;
    if (!section || !pin || !panels || reduceMotion || isMobile) return;

    const panelEls = panels.querySelectorAll<HTMLElement>("[data-story-panel]");
    const use3D = enable3D;

    const ctx = gsap.context(() => {
      if (use3D) {
        panelEls.forEach((panel, index) => {
          const depth = PANEL_DEPTH[index] ?? PANEL_DEPTH[0];
          gsap.set(panel, {
            autoAlpha: index === 0 ? 1 : 0,
            z: index === 0 ? depth.activeZ : depth.enterZ,
            rotateX: index === 0 ? 0 : depth.enterRotX,
            rotateY: 0,
            transformPerspective: 1100,
          });
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${STATIONS.length * 58}%`,
            pin: pin,
            scrub: 0.55,
            anticipatePin: 1,
            onUpdate: (self) => {
              const idx = Math.min(
                STATIONS.length - 1,
                Math.floor(self.progress * STATIONS.length)
              );
              setActiveIndex(idx);
            },
          },
        });

        panelEls.forEach((panel, index) => {
          if (index === 0) return;
          const prev = PANEL_DEPTH[index - 1] ?? PANEL_DEPTH[0];
          const next = PANEL_DEPTH[index] ?? PANEL_DEPTH[0];
          const at = index * 0.2;

          tl.to(
            panelEls[index - 1],
            {
              autoAlpha: 0,
              z: prev.exitZ,
              rotateX: prev.exitRotX,
              duration: 0.35,
              ease: "power1.inOut",
            },
            at
          ).fromTo(
            panel,
            {
              autoAlpha: 0,
              z: next.enterZ,
              rotateX: next.enterRotX,
            },
            {
              autoAlpha: 1,
              z: next.activeZ,
              rotateX: 0,
              duration: 0.45,
              ease: "power2.out",
            },
            at + 0.05
          );
        });
      } else {
        gsap.set(panelEls, { autoAlpha: 0, y: 24 });
        gsap.set(panelEls[0], { autoAlpha: 1, y: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${STATIONS.length * 55}%`,
            pin: pin,
            scrub: 0.55,
            anticipatePin: 1,
            onUpdate: (self) => {
              const idx = Math.min(
                STATIONS.length - 1,
                Math.floor(self.progress * STATIONS.length)
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
      }
    }, section);

    return () => ctx.revert();
  }, [reduceMotion, isMobile, enable3D]);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="landing-v2-section relative overflow-hidden"
      aria-labelledby="lv2-story-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-v2-kicker mb-3">
          <span className="landing-v2-kicker__dot" aria-hidden />
          {sectionCopy.eyebrow}
        </p>
        <h2
          id="lv2-story-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
        >
          {sectionCopy.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-white/58">
          {sectionCopy.subline}
        </p>

        {isMobile || reduceMotion ? (
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
            <div className="grid min-h-[70vh] items-center gap-10 lg:grid-cols-[220px_1fr]">
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

              <div
                className={`landing-v2-scroll-story__stage-3d ${
                  enable3D ? "" : "landing-v2-scroll-story__stage-3d--flat"
                }`}
              >
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
