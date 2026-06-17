"use client";

import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";

const panelCopy = LANDING_V2_COPY.hero.productPanel;

type LandingV2SystemSurfaceProps = {
  variant?: "hero" | "compact";
};

/** Dark operating-system surface — not a SaaS card */
export function LandingV2SystemSurface({ variant = "hero" }: LandingV2SystemSurfaceProps) {
  const isCompact = variant === "compact";
  const queueItems = isCompact
    ? panelCopy.queue.items.slice(0, 2)
    : panelCopy.queue.items;

  return (
    <div
      className={`landing-v2-system-surface ${
        isCompact ? "landing-v2-system-surface--compact" : "landing-v2-system-surface--hero"
      }`}
    >
      <header className="landing-v2-system-surface__bar">
        <div className="landing-v2-system-surface__bar-left">
          <span className="landing-v2-system-surface__dot" aria-hidden />
          <span className="landing-v2-system-surface__bar-label">{panelCopy.label}</span>
        </div>
        <span className="landing-v2-system-surface__signal">Production flow</span>
      </header>

      <div className="landing-v2-system-surface__viewport">
        <div className="landing-v2-system-surface__grid" aria-hidden />
        <div className="landing-v2-system-surface__briefing">
          <p className="landing-v2-system-surface__briefing-title">
            {panelCopy.briefing.title}
          </p>
          <p className="landing-v2-system-surface__briefing-text">{panelCopy.briefing.text}</p>
        </div>

        <ul className="landing-v2-system-surface__tracks" aria-label={panelCopy.paths.title}>
          {panelCopy.paths.items.map((item, index) => (
            <li
              key={item}
              className={`landing-v2-system-surface__track ${
                index === 0 ? "landing-v2-system-surface__track--active" : ""
              }`}
            >
              <span className="landing-v2-system-surface__track-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="landing-v2-system-surface__track-label">
                {isCompact && item === "Kampagne planen" ? "Kampagne" : item}
              </span>
              <span className="landing-v2-system-surface__track-line" aria-hidden />
            </li>
          ))}
        </ul>
      </div>

      <footer className="landing-v2-system-surface__footer">
        <p className="landing-v2-system-surface__footer-title">{panelCopy.queue.title}</p>
        <ul className="landing-v2-system-surface__queue">
          {queueItems.map((item, index) => (
            <li key={item.name} className="landing-v2-system-surface__queue-item">
              <span
                className={`landing-v2-system-surface__queue-dot ${
                  index === 0 ? "landing-v2-system-surface__queue-dot--lime" : ""
                }`}
                aria-hidden
              />
              <span className="landing-v2-system-surface__queue-name">{item.name}</span>
              <span className="landing-v2-system-surface__queue-status">{item.status}</span>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
