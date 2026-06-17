"use client";

import { LandingV2StudioSurface, type StudioSurfaceVariant } from "./LandingV2StudioSurface";

type LandingV2WorkflowStageProps = {
  chapter: string;
  label: string;
  stageLabel: string;
  stageStatus: string;
  surfaceVariant: StudioSurfaceVariant;
  step: number;
  total: number;
  isActive?: boolean;
};

export function LandingV2WorkflowStage({
  stageLabel,
  stageStatus,
  surfaceVariant,
  step,
  total,
  isActive = false,
}: LandingV2WorkflowStageProps) {
  return (
    <div
      className={`landing-v2-workflow-stage ${isActive ? "landing-v2-workflow-stage--active" : ""}`}
    >
      <div className="landing-v2-workflow-stage__header">
        <span className="landing-v2-workflow-stage__line" aria-hidden />
        <div className="landing-v2-workflow-stage__meta">
          <p className="landing-v2-workflow-stage__chapter">{stageLabel}</p>
          <p className="landing-v2-workflow-stage__step">
            {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
        </div>
      </div>
      <div className="landing-v2-workflow-stage__frame" data-workflow-stage-frame>
        <LandingV2StudioSurface
          variant={surfaceVariant}
          label={stageLabel}
          status={stageStatus}
        />
      </div>
    </div>
  );
}
