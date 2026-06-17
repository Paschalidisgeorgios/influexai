"use client";

import { useRef } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LandingV2AssetImage } from "../ui/LandingV2Asset";
import { LandingV2ChapterMarker } from "../ui/LandingV2ChapterMarker";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";
import { useStudio3DScene } from "../hooks/useStudio3DScene";

const copy = LANDING_V2_COPY.studio;
const chapterCopy = LANDING_V2_COPY.chapters.studio;

const PANEL_CLASS: Record<string, string> = {
  studio: "landing-v2-studio-world__module--cockpit",
  agent: "landing-v2-studio-world__module--agent",
  tools: "landing-v2-studio-world__module--tools",
  gallery: "landing-v2-studio-world__module--gallery",
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
        <LandingV2ChapterMarker number={chapterCopy.number} label={chapterCopy.label} />
        <h2
          id="lv2-studio-heading"
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

        <div
          className={`landing-v2-studio-world mt-12 md:mt-16 ${
            isMobile || reduceMotion ? "landing-v2-studio-world--stacked" : ""
          }`}
          data-lv2-stagger
        >
          <div
            ref={sceneRef}
            className={`landing-v2-studio-world__frame ${
              enableCinematicScroll && !isMobile && !reduceMotion ? "landing-v2-scene-3d" : ""
            }`}
          >
            <div className="landing-v2-scene-3d__rig landing-v2-studio-world__rig">
              <div className="landing-v2-studio-world__canvas" aria-hidden>
                <div className="landing-v2-studio-world__canvas-grid" />
                {panels[0]?.asset ? (
                  <div className="landing-v2-studio-world__canvas-visual">
                    <LandingV2AssetImage slot={panels[0].asset} />
                  </div>
                ) : null}
              </div>

              <ul className="landing-v2-studio-world__modules">
                {panels.map((panel, index) => (
                  <li
                    key={panel.id}
                    data-studio-panel
                    className={`landing-v2-studio-world__module landing-v2-panel-3d ${
                      PANEL_CLASS[panel.id] ?? ""
                    } ${index === 0 ? "landing-v2-studio-world__module--active" : ""}`}
                  >
                    <span className="landing-v2-studio-world__module-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="landing-v2-studio-world__module-copy">
                      <p className="landing-v2-studio-world__module-label">{panel.label}</p>
                      <h3 className="landing-v2-headline landing-v2-studio-world__module-title">
                        {panel.title}
                      </h3>
                      <p className="landing-v2-studio-world__module-desc">{panel.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
