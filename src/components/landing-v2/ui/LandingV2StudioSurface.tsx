"use client";

export type StudioSurfaceVariant = "briefing" | "path" | "image" | "motion" | "gallery";

type LandingV2StudioSurfaceProps = {
  variant: StudioSurfaceVariant;
  label: string;
  status?: string;
};

function SurfaceInterior({ variant }: { variant: StudioSurfaceVariant }) {
  switch (variant) {
    case "briefing":
      return (
        <div className="landing-v2-studio-surface__briefing">
          <div className="landing-v2-studio-surface__line landing-v2-studio-surface__line--wide" />
          <div className="landing-v2-studio-surface__line" />
          <div className="landing-v2-studio-surface__line landing-v2-studio-surface__line--short" />
          <div className="landing-v2-studio-surface__tag-row">
            <span className="landing-v2-studio-surface__tag">Hook</span>
            <span className="landing-v2-studio-surface__tag">Stil</span>
          </div>
        </div>
      );
    case "path":
      return (
        <div className="landing-v2-studio-surface__paths">
          <span className="landing-v2-studio-surface__path landing-v2-studio-surface__path--active">
            Bild
          </span>
          <span className="landing-v2-studio-surface__path">Video</span>
          <span className="landing-v2-studio-surface__path">Kampagne</span>
        </div>
      );
    case "image":
      return (
        <div className="landing-v2-studio-surface__visual">
          <div className="landing-v2-studio-surface__visual-frame" />
          <div className="landing-v2-studio-surface__visual-accent" />
        </div>
      );
    case "motion":
      return (
        <div className="landing-v2-studio-surface__motion">
          <div className="landing-v2-studio-surface__motion-track">
            <span className="landing-v2-studio-surface__motion-play" aria-hidden />
          </div>
          <div className="landing-v2-studio-surface__motion-bars">
            <span /><span /><span /><span />
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="landing-v2-studio-surface__gallery">
          <div className="landing-v2-studio-surface__thumb landing-v2-studio-surface__thumb--active" />
          <div className="landing-v2-studio-surface__thumb" />
          <div className="landing-v2-studio-surface__thumb" />
        </div>
      );
    default:
      return null;
  }
}

export function LandingV2StudioSurface({ variant, label, status }: LandingV2StudioSurfaceProps) {
  return (
    <div
      className={`landing-v2-studio-surface landing-v2-studio-surface--${variant}`}
      role="img"
      aria-label={label}
    >
      <div className="landing-v2-studio-surface__bar">
        <span className="landing-v2-studio-surface__dot" aria-hidden />
        <span className="landing-v2-studio-surface__label">{label}</span>
        {status ? <span className="landing-v2-studio-surface__status">{status}</span> : null}
      </div>
      <div className="landing-v2-studio-surface__canvas">
        <SurfaceInterior variant={variant} />
      </div>
    </div>
  );
}
