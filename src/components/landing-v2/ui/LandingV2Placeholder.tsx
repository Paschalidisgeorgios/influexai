"use client";

export type LandingV2PlaceholderVariant =
  | "hero"
  | "studio"
  | "tools"
  | "agent"
  | "gallery"
  | "campaign-visual"
  | "motion-draft";

type LandingV2PlaceholderProps = {
  variant: LandingV2PlaceholderVariant;
  label: string;
  className?: string;
  aspectClassName?: string;
};

export function LandingV2Placeholder({
  variant,
  label,
  className = "",
  aspectClassName = "aspect-[16/10]",
}: LandingV2PlaceholderProps) {
  return (
    <div
      className={`landing-v2-placeholder landing-v2-placeholder--${variant} ${aspectClassName} ${className}`}
      role="img"
      aria-label={label}
    >
      <div className="landing-v2-placeholder__chrome" aria-hidden>
        <span className="landing-v2-placeholder__dot landing-v2-placeholder__dot--lime" />
        <span className="landing-v2-placeholder__line landing-v2-placeholder__line--wide" />
        <span className="landing-v2-placeholder__line" />
      </div>
      <div className="landing-v2-placeholder__stage" aria-hidden>
        <div className="landing-v2-placeholder__block landing-v2-placeholder__block--main" />
        <div className="landing-v2-placeholder__block landing-v2-placeholder__block--side" />
        <div className="landing-v2-placeholder__block landing-v2-placeholder__block--row" />
      </div>
      <p className="landing-v2-placeholder__label">{label}</p>
    </div>
  );
}
