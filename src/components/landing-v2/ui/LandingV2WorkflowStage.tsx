"use client";

import { LandingV2Placeholder, type LandingV2PlaceholderVariant } from "./LandingV2Placeholder";

type LandingV2WorkflowStageProps = {
  chapter: string;
  label: string;
  step: number;
  total: number;
  placeholderVariant: LandingV2PlaceholderVariant;
  isActive?: boolean;
};

export function LandingV2WorkflowStage({
  chapter,
  label,
  step,
  total,
  placeholderVariant,
  isActive = false,
}: LandingV2WorkflowStageProps) {
  return (
    <div
      className={`landing-v2-workflow-stage ${isActive ? "landing-v2-workflow-stage--active" : ""}`}
    >
      <div className="landing-v2-workflow-stage__header">
        <span className="landing-v2-workflow-stage__line" aria-hidden />
        <div className="landing-v2-workflow-stage__meta">
          <p className="landing-v2-workflow-stage__chapter">{chapter}</p>
          <p className="landing-v2-workflow-stage__step">
            {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
        </div>
      </div>
      <div className="landing-v2-workflow-stage__frame">
        <LandingV2Placeholder
          variant={placeholderVariant}
          label={label}
          aspectClassName="aspect-[16/10] min-h-[10rem] md:min-h-[12rem]"
          className="landing-v2-workflow-stage__visual"
        />
      </div>
      <p className="landing-v2-workflow-stage__caption">{label}</p>
    </div>
  );
}
