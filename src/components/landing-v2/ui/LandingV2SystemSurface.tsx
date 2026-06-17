"use client";

import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";

const surfaceCopy = LANDING_V2_COPY.hero.systemSurface;

type LandingV2SystemSurfaceProps = {
  variant?: "hero" | "compact";
};

/** OS stage surface — system layers, not feature cards */
export function LandingV2SystemSurface({ variant = "hero" }: LandingV2SystemSurfaceProps) {
  const isCompact = variant === "compact";
  const layers = isCompact
    ? surfaceCopy.layers
    : surfaceCopy.layers;

  return (
    <div
      className={`landing-v2-system-surface ${
        isCompact ? "landing-v2-system-surface--compact" : "landing-v2-system-surface--hero"
      }`}
    >
      <header className="landing-v2-system-surface__bar">
        <div className="landing-v2-system-surface__bar-left">
          <span className="landing-v2-system-surface__dot" aria-hidden />
          <span className="landing-v2-system-surface__bar-label">{surfaceCopy.label}</span>
        </div>
        <span className="landing-v2-system-surface__signal">{surfaceCopy.signal}</span>
      </header>

      <div className="landing-v2-system-surface__viewport">
        <div className="landing-v2-system-surface__grid" aria-hidden />
        <ul className="landing-v2-system-surface__layers" aria-label={surfaceCopy.label}>
          {layers.map((layer, index) => (
            <li
              key={layer.id}
              className={`landing-v2-system-surface__layer ${
                index === 0 ? "landing-v2-system-surface__layer--active" : ""
              }`}
            >
              <span className="landing-v2-system-surface__layer-index">{layer.index}</span>
              <div className="landing-v2-system-surface__layer-copy">
                <span className="landing-v2-system-surface__layer-label">{layer.label}</span>
                {!isCompact ? (
                  <span className="landing-v2-system-surface__layer-hint">{layer.hint}</span>
                ) : null}
              </div>
              <span className="landing-v2-system-surface__layer-line" aria-hidden />
            </li>
          ))}
        </ul>
      </div>

      <footer className="landing-v2-system-surface__footer">
        <span className="landing-v2-system-surface__status">{surfaceCopy.status}</span>
      </footer>
    </div>
  );
}
