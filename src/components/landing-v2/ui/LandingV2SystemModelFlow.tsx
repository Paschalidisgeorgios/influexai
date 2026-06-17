"use client";

import { useRef } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSystemModelReveal } from "../hooks/useSystemModelReveal";

type LandingV2SystemModelFlowProps = {
  className?: string;
};

const copy = LANDING_V2_COPY.systemModel;

/** Command-first dashboard model — Eingabe to Galerie, no provider names */
export function LandingV2SystemModelFlow({ className = "" }: LandingV2SystemModelFlowProps) {
  const flowRef = useRef<HTMLDivElement>(null);
  const links = useLandingV2Links();
  const motionEnabled = links.mode === "preview" && links.enablePreviewMotion;

  useSystemModelReveal(flowRef, motionEnabled);

  const rootClass = ["landing-v2-system-model", className].filter(Boolean).join(" ");

  return (
    <div ref={flowRef} className={rootClass} data-lv2-stagger aria-label={copy.kicker}>
      <p className="landing-v2-system-model__kicker">{copy.kicker}</p>

      <ol className="landing-v2-system-model__steps">
        {copy.steps.map((step) => (
          <li
            key={step.id}
            className="landing-v2-system-model__step"
            data-system-model-step
          >
            <span className="landing-v2-system-model__step-label">{step.label}</span>
            <span className="landing-v2-system-model__step-hint">{step.hint}</span>
          </li>
        ))}
      </ol>

      <div className="landing-v2-system-model__connector" aria-hidden>
        <div className="landing-v2-system-model__connector-line" data-system-model-line />
        <div className="landing-v2-system-model__connector-dots">
          {copy.steps.map((step) => (
            <span key={`${step.id}-dot`} className="landing-v2-system-model__dot" />
          ))}
        </div>
      </div>
    </div>
  );
}
