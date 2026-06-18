"use client";

/** Fixed dashboard preview backdrop — aligned with landing-v2 OS DNA */
export function PreviewBackgroundSystem() {
  return (
    <div className="preview-bg-system" aria-hidden>
      <div className="preview-bg-system__base" />
      <div className="preview-bg-system__grid" />
      <div className="preview-bg-system__glow" />
      <div className="preview-bg-system__vignette" />
    </div>
  );
}
