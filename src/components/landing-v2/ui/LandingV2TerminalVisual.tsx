"use client";

import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LandingV2AssetImage, LandingV2AssetVideo } from "./LandingV2Asset";

export type TerminalVisualVariant = "briefing" | "visual" | "motion" | "gallery";

type LandingV2TerminalVisualProps = {
  variant: TerminalVisualVariant;
  className?: string;
};

/** Abstract system surfaces — no fake demos */
export function LandingV2TerminalVisual({
  variant,
  className = "",
}: LandingV2TerminalVisualProps) {
  const rootClass = [
    "landing-v2-terminal-visual",
    `landing-v2-terminal-visual--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (variant === "briefing") {
    return (
      <div className={rootClass} data-terminal-visual aria-hidden>
        <div className="landing-v2-terminal-visual__chrome">
          <span className="landing-v2-terminal-visual__dot" />
          <span className="landing-v2-terminal-visual__chrome-label">Command / Briefing</span>
        </div>
        <div className="landing-v2-terminal-visual__briefing">
          <p className="landing-v2-terminal-visual__prompt">
            <span className="landing-v2-terminal-visual__caret">&gt;</span> Kampagnenbriefing
            erstellen
          </p>
          <div className="landing-v2-terminal-visual__briefing-meta">
            <span>Plattform · Instagram</span>
            <span>Ziel · Awareness</span>
            <span>Format · 9:16</span>
          </div>
          <div className="landing-v2-terminal-visual__briefing-agent">
            <span className="landing-v2-terminal-visual__agent-tag">Agent</span>
            <p>Was ist das Kernversprechen der Kampagne?</p>
          </div>
          <div className="landing-v2-terminal-visual__briefing-input">
            <span />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "visual") {
    return (
      <div className={rootClass} data-terminal-visual aria-hidden>
        <div className="landing-v2-terminal-visual__chrome">
          <span className="landing-v2-terminal-visual__dot landing-v2-terminal-visual__dot--lime" />
          <span className="landing-v2-terminal-visual__chrome-label">Asset Surface / Visual</span>
        </div>
        <div className="landing-v2-terminal-visual__frame">
          <LandingV2AssetImage slot={LANDING_V2_ASSETS.proofImage} />
        </div>
        <div className="landing-v2-terminal-visual__meta">
          <span>Engine ready</span>
          <span>Prompt optimized</span>
        </div>
      </div>
    );
  }

  if (variant === "motion") {
    return (
      <div className={rootClass} data-terminal-visual aria-hidden>
        <div className="landing-v2-terminal-visual__chrome">
          <span className="landing-v2-terminal-visual__dot landing-v2-terminal-visual__dot--lime" />
          <span className="landing-v2-terminal-visual__chrome-label">Motion Surface</span>
        </div>
        <div className="landing-v2-terminal-visual__frame landing-v2-terminal-visual__frame--motion">
          <LandingV2AssetVideo
            webm={LANDING_V2_ASSETS.outputVideo.webm}
            mp4={LANDING_V2_ASSETS.outputVideo.mp4}
            poster={LANDING_V2_ASSETS.outputVideo.poster}
            placeholderLabel={LANDING_V2_ASSETS.outputVideo.placeholderLabel}
            variant="motion-draft"
          />
        </div>
        <div className="landing-v2-terminal-visual__meta">
          <span>Startbild · Motion Prompt</span>
          <span>Format · 9:16</span>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass} data-terminal-visual aria-hidden>
      <div className="landing-v2-terminal-visual__chrome">
        <span className="landing-v2-terminal-visual__dot" />
        <span className="landing-v2-terminal-visual__chrome-label">Asset Library</span>
      </div>
      <div className="landing-v2-terminal-visual__library">
        {LANDING_V2_ASSETS.products.slice(0, 4).map((product) => (
          <div key={product.id} className="landing-v2-terminal-visual__library-item">
            <div
              className="landing-v2-terminal-visual__library-thumb"
              style={{ backgroundImage: `url(${product.primary})` }}
            />
            <span>{product.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
