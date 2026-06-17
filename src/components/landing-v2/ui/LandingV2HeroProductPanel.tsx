"use client";

import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";

const panelCopy = LANDING_V2_COPY.hero.productPanel;

export function LandingV2HeroProductPanel({
  variant = "default",
}: {
  variant?: "default" | "stage" | "compact";
}) {
  const isCompact = variant === "compact";
  const queueItems = isCompact
    ? panelCopy.queue.items.slice(0, 2)
    : panelCopy.queue.items;

  return (
    <div
      className={`landing-v2-hero-product ${
        variant === "stage" ? "landing-v2-hero-product--stage" : ""
      } ${isCompact ? "landing-v2-hero-product--compact" : ""}`}
    >
      <div className="landing-v2-hero-product__sheen" aria-hidden />
      <div className="landing-v2-hero-product__content">
        <header className="landing-v2-hero-product__header">
          <div className="landing-v2-hero-product__header-row">
            <p className="landing-v2-hero-product__label">
              <span className="landing-v2-kicker__dot" aria-hidden />
              {panelCopy.label}
            </p>
            <span className="landing-v2-hero-product__status-pill">Live</span>
          </div>
          <h2 className="landing-v2-hero-product__headline">{panelCopy.headline}</h2>
        </header>

        <div className="landing-v2-hero-product__briefing">
          <p className="landing-v2-hero-product__section-title">{panelCopy.briefing.title}</p>
          <p className="landing-v2-hero-product__briefing-text">{panelCopy.briefing.text}</p>
          <span className="landing-v2-hero-product__inline-status">Briefing ready</span>
        </div>

        <div className="landing-v2-hero-product__block">
          <p className="landing-v2-hero-product__section-title">{panelCopy.paths.title}</p>
          <ul className="landing-v2-hero-product__chips" aria-label={panelCopy.paths.title}>
            {panelCopy.paths.items.map((item, index) => (
              <li key={item}>
                <span
                  className={`landing-v2-hero-product__chip ${
                    index === 0 ? "landing-v2-hero-product__chip--active" : ""
                  }`}
                >
                  {isCompact && item === "Kampagne planen" ? "Kampagne" : item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="landing-v2-hero-product__block">
          <p className="landing-v2-hero-product__section-title">{panelCopy.queue.title}</p>
          <ul className="landing-v2-hero-product__queue">
            {queueItems.map((item, index) => (
              <li key={item.name} className="landing-v2-hero-product__queue-item">
                <span
                  className={`landing-v2-hero-product__queue-dot ${
                    index === 0 ? "landing-v2-hero-product__queue-dot--lime" : ""
                  }`}
                  aria-hidden
                />
                <span className="landing-v2-hero-product__queue-name">{item.name}</span>
                <span className="landing-v2-hero-product__queue-status">{item.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
