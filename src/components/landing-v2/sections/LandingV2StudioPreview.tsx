"use client";

import { useRef } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2AssetImage } from "../ui/LandingV2Asset";
import { useLandingReveal } from "../hooks/useLandingReveal";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useStudio3DScene } from "../hooks/useStudio3DScene";

const copy = LANDING_V2_COPY.studio;

const PANEL_CLASS: Record<string, string> = {
  studio: "landing-v2-studio-panel--studio",
  tools: "landing-v2-studio-panel--tools",
  agent: "landing-v2-studio-panel--agent",
  gallery: "landing-v2-studio-panel--gallery",
};

export function LandingV2StudioPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const { isMobile, reduceMotion, enable3D } = useLandingViewport();

  useLandingReveal(sectionRef);
  useStudio3DScene(sectionRef, sceneRef, enable3D);

  const panels = copy.panels.map((panel) => ({
    ...panel,
    asset: LANDING_V2_ASSETS.products.find((p) => p.id === panel.id),
  }));

  return (
    <section
      id="studio"
      ref={sectionRef}
      className="landing-v2-section overflow-hidden"
      aria-labelledby="lv2-studio-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="landing-v2-kicker mb-3" data-lv2-reveal>
          <span className="landing-v2-kicker__dot" aria-hidden />
          {copy.eyebrow}
        </p>
        <h2
          id="lv2-studio-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3.25rem)] text-[var(--lv2-text-light)]"
          data-lv2-reveal
        >
          {copy.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-white/58" data-lv2-reveal>
          {copy.subline}
        </p>

        {isMobile || reduceMotion ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {panels.map((panel) => (
              <article
                key={panel.id}
                className="landing-v2-ivory-stage overflow-hidden p-4 md:p-5"
                data-lv2-reveal
              >
                {panel.asset ? (
                  <div className="landing-v2-product-tile">
                    <LandingV2AssetImage slot={panel.asset} />
                  </div>
                ) : null}
                <p className="mt-3 text-xs uppercase tracking-[0.1em] text-[var(--lv2-text-muted)]">
                  {panel.label}
                </p>
                <h3 className="landing-v2-headline mt-1 text-lg">{panel.title}</h3>
                <p className="mt-1 text-sm text-[var(--lv2-text-muted)]">
                  {panel.description}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div
            ref={sceneRef}
            className={`landing-v2-studio-scene ${
              enable3D ? "landing-v2-scene-3d" : ""
            }`}
          >
            <div className="landing-v2-scene-3d__rig h-full min-h-[inherit]">
              {panels.map((panel) => (
                <article
                  key={panel.id}
                  data-studio-panel
                  className={`landing-v2-studio-panel landing-v2-panel-3d ${
                    PANEL_CLASS[panel.id] ?? ""
                  }`}
                >
                  <div className="landing-v2-ivory-stage landing-v2-studio-panel__inner p-3 md:p-4">
                    {panel.asset ? (
                      <div className="landing-v2-product-tile">
                        <LandingV2AssetImage slot={panel.asset} />
                      </div>
                    ) : null}
                    <p className="mt-3 text-[0.65rem] uppercase tracking-[0.1em] text-[var(--lv2-text-muted)]">
                      {panel.label}
                    </p>
                    <h3 className="landing-v2-headline mt-1 text-base leading-snug">
                      {panel.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--lv2-text-muted)]">
                      {panel.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
