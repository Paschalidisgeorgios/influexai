import type { ShowcaseItemId } from "@/lib/landing-showcase-items";

type Props = {
  variant: ShowcaseItemId;
};

export function ShowcaseAssetVisual({ variant }: Props) {
  return (
    <div className={`showcase-visual showcase-visual--${variant}`} aria-hidden>
      {variant === "reel" && (
        <>
          <div className="showcase-visual__glow showcase-visual__glow--lime" />
          <div className="showcase-visual__phone">
            <div className="showcase-visual__product">
              <span className="showcase-visual__product-ring" />
              <span className="showcase-visual__product-core" />
            </div>
            <span className="showcase-visual__chip">LAUNCH</span>
          </div>
        </>
      )}

      {variant === "motion" && (
        <>
          <div className="showcase-visual__glow showcase-visual__glow--lime-soft" />
          <div className="showcase-visual__dashboard">
            <div className="showcase-visual__dash-bar" />
            <div className="showcase-visual__dash-grid">
              <span />
              <span />
              <span className="showcase-visual__dash-grid--active" />
            </div>
            <div className="showcase-visual__dash-line" />
            <div className="showcase-visual__dash-line showcase-visual__dash-line--short" />
          </div>
          <span className="showcase-visual__play">▶</span>
        </>
      )}

      {variant === "hook" && (
        <>
          <div className="showcase-visual__hook-bg" />
          <p className="showcase-visual__hook-text">
            POV:
            <br />
            Du scrollst
            <br />
            <span>stopp hier.</span>
          </p>
        </>
      )}

      {variant === "adPack" && (
        <>
          <div className="showcase-visual__stack showcase-visual__stack--back" />
          <div className="showcase-visual__stack showcase-visual__stack--mid" />
          <div className="showcase-visual__stack showcase-visual__stack--front">
            <span className="showcase-visual__stack-label">Reel</span>
            <span className="showcase-visual__stack-label">Story</span>
            <span className="showcase-visual__stack-label showcase-visual__stack-label--active">
              Feed
            </span>
          </div>
        </>
      )}

      {variant === "creator" && (
        <>
          <div className="showcase-visual__creator-bg" />
          <div className="showcase-visual__creator-frame">
            <div className="showcase-visual__creator-avatar" />
            <div className="showcase-visual__creator-lines">
              <span />
              <span />
              <span className="showcase-visual__creator-lines--short" />
            </div>
          </div>
          <div className="showcase-visual__creator-phone" />
        </>
      )}

      {variant === "score" && (
        <>
          <div className="showcase-visual__score-ring">
            <span className="showcase-visual__score-value">91</span>
          </div>
          <div className="showcase-visual__score-metrics">
            <div>
              <span>Hook</span>
              <strong>94</strong>
            </div>
            <div>
              <span>Format</span>
              <strong>88</strong>
            </div>
            <div>
              <span>Scroll</span>
              <strong>92</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
