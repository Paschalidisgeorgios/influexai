"use client";

const FLOW_STEPS = ["Briefing", "Visual", "Motion", "Galerie"] as const;

type LandingV2FlowStageProps = {
  variant?: "system" | "workflow" | "hero";
  className?: string;
};

/** Abstract production flow — tracks and modules, no UI dummies */
export function LandingV2FlowStage({
  variant = "system",
  className = "",
}: LandingV2FlowStageProps) {
  const rootClass = [
    "landing-v2-flow-stage",
    `landing-v2-flow-stage--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} data-lv2-stagger aria-hidden="true">
      <svg
        className="landing-v2-flow-stage__lines"
        viewBox="0 0 1200 280"
        preserveAspectRatio="none"
      >
        <path
          d="M 40 140 H 1160"
          className="landing-v2-flow-stage__path"
        />
        <path
          d="M 40 140 H 1160"
          className="landing-v2-flow-stage__path landing-v2-flow-stage__path--active"
        />
      </svg>
      <ul className="landing-v2-flow-stage__nodes">
        {FLOW_STEPS.map((label, index) => (
          <li key={label} className="landing-v2-flow-stage__node">
            <span className="landing-v2-flow-stage__index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="landing-v2-flow-stage__label">{label}</span>
            <span className="landing-v2-flow-stage__dot" />
          </li>
        ))}
      </ul>
    </div>
  );
}
