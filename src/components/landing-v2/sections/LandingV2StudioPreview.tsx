"use client";

import { useRef } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2AssetImage } from "../ui/LandingV2Asset";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { useStudio3DScene } from "../hooks/useStudio3DScene";

const copy = LANDING_V2_COPY.studio;

const PANEL_CLASS: Record<string, string> = {
  studio: "landing-v2-studio-layer--cockpit",
  tools: "landing-v2-studio-layer--tools",
  agent: "landing-v2-studio-layer--agent",
  gallery: "landing-v2-studio-layer--gallery",
};

export function LandingV2StudioPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const { isMobile, reduceMotion, enableCinematicScroll } = useLandingViewport();
  const { enablePreviewMotion } = useLandingV2Links();

  useSectionDramaturgy(sectionRef);
  useStudio3DScene(sectionRef, sceneRef, enableCinematicScroll && enablePreviewMotion);

  const panels = copy.panels.map((panel) => ({
    ...panel,
    asset: LANDING_V2_ASSETS.products.find((p) => p.id === panel.id),
  }));

  return (
    <section
      id="studio"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--editorial overflow-hidden"
      aria-labelledby="lv2-studio-heading"
    >
      <div className="mx-auto max-w-[90rem]">
        <p className="landing-v2-kicker mb-4" data-lv2-eyebrow>
          <span className="landing-v2-kicker__dot" aria-hidden />
          {copy.eyebrow}
        </p>
        <h2
          id="lv2-studio-heading"
          className="landing-v2-headline landing-v2-editorial-title text-[var(--lv2-text-light)]"
        >
          {copy.headlineLines.map((line) => (
            <span key={line} className="block" data-lv2-headline-line>
              {line}
            </span>
          ))}
        </h2>
        <p className="landing-v2-editorial-lead mt-4 max-w-2xl text-white/55" data-lv2-subline>
          {copy.subline}
        </p>

        {isMobile || reduceMotion ? (
          <div className="landing-v2-studio-stack mt-12 space-y-6">
            {panels.map((panel) => (
              <article
                key={panel.id}
                className="landing-v2-studio-stack__item"
                data-lv2-stagger
              >
                {panel.asset ? (
                  <div className="landing-v2-studio-stack__visual">
                    <LandingV2AssetImage slot={panel.asset} />
                  </div>
                ) : null}
                <p className="mt-4 text-xs uppercase tracking-[0.12em] text-white/45">
                  {panel.label}
                </p>
                <h3 className="landing-v2-headline mt-1 text-xl">{panel.title}</h3>
                <p className="mt-2 text-sm text-white/55">{panel.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <div
            ref={sceneRef}
            className={`landing-v2-studio-stage ${
              enableCinematicScroll ? "landing-v2-scene-3d" : ""
            }`}
          >
            <div className="landing-v2-scene-3d__rig landing-v2-studio-stage__rig h-full min-h-[inherit]">
              {panels.map((panel) => (
                <article
                  key={panel.id}
                  data-studio-panel
                  className={`landing-v2-studio-layer landing-v2-panel-3d ${
                    PANEL_CLASS[panel.id] ?? ""
                  }`}
                >
                  {panel.asset ? (
                    <div className="landing-v2-studio-layer__visual">
                      <LandingV2AssetImage slot={panel.asset} />
                    </div>
                  ) : null}
                  <div className="landing-v2-studio-layer__meta">
                    <p className="landing-v2-studio-layer__label">{panel.label}</p>
                    <h3 className="landing-v2-headline landing-v2-studio-layer__title">
                      {panel.title}
                    </h3>
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
