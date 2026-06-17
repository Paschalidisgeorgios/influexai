"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useCreatorFlowReveal } from "../hooks/useCreatorFlowReveal";

type LandingV2CreatorProductionFlowProps = {
  variant?: "hero" | "system" | "workflow";
  className?: string;
};

const copy = LANDING_V2_COPY.creatorProductionFlow;

/** Clear creator production map — Briefing to Gallery, no fake dashboard status */
export function LandingV2CreatorProductionFlow({
  variant = "system",
  className = "",
}: LandingV2CreatorProductionFlowProps) {
  const flowRef = useRef<HTMLDivElement>(null);
  const links = useLandingV2Links();
  const motionEnabled = links.mode === "preview" && links.enablePreviewMotion;

  useCreatorFlowReveal(flowRef, motionEnabled, variant);

  const rootClass = [
    "landing-v2-creator-flow",
    `landing-v2-creator-flow--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={flowRef}
      className={rootClass}
      data-lv2-stagger
      aria-label={copy.kicker}
    >
      <header className="landing-v2-creator-flow__header">
        <p
          className="landing-v2-creator-flow__kicker"
          data-creator-flow-hero-item={variant === "hero" ? "" : undefined}
        >
          {copy.kicker}
        </p>
        <p
          className="landing-v2-creator-flow__headline"
          data-creator-flow-hero-item={variant === "hero" ? "" : undefined}
        >
          {copy.headline}
        </p>
        <p
          className="landing-v2-creator-flow__subline"
          data-creator-flow-hero-item={variant === "hero" ? "" : undefined}
        >
          {copy.subline}
        </p>
      </header>

      {variant === "hero" ? (
        <div className="landing-v2-creator-flow__accent" aria-hidden />
      ) : (
        <div className="landing-v2-creator-flow__map">
          <ol className="landing-v2-creator-flow__stations">
            {copy.stations.map((station) => (
              <li
                key={station.index}
                className="landing-v2-creator-flow__station"
                data-creator-flow-station
              >
                <span className="landing-v2-creator-flow__station-index">{station.index}</span>
                <div className="landing-v2-creator-flow__station-copy">
                  <span className="landing-v2-creator-flow__station-label">{station.label}</span>
                  <p className="landing-v2-creator-flow__station-desc">{station.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="landing-v2-creator-flow__connector" aria-hidden>
            <div
              className="landing-v2-creator-flow__connector-line"
              data-creator-flow-line
            />
            <div className="landing-v2-creator-flow__connector-dots">
              {copy.stations.map((station) => (
                <span
                  key={`${station.index}-dot`}
                  className="landing-v2-creator-flow__station-dot"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
