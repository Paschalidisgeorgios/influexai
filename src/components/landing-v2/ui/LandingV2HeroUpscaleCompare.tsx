"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLandingV2Links } from "../LandingV2ModeContext";

const HERO_MEDIA = LANDING_V2_ASSETS.heroPreviewVideo;
const DEFAULT_SPLIT = 52;
const HOVER_SPLIT = 58;
const STATIC_SPLIT = 50;

const COPY = {
  kicker: "TOPAZ UPSCALE",
  headline: "Aus Standard wird Studio-Qualität.",
  subline: "Vorher / Nachher direkt im Produktionsfluss.",
  beforeTitle: "Vorher",
  beforeMeta: "Original",
  afterTitle: "Nachher",
  afterMeta: "Topaz Video Upscale",
  previewNote: "Illustrative Vorschau — kein echtes Upscale-Ergebnis.",
} as const;

type MediaLayerProps = {
  variant: "before" | "after";
  useVideo: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
};

function MediaLayer({ variant, useVideo, videoRef }: MediaLayerProps) {
  const className = `landing-v2-hero-upscale__media landing-v2-hero-upscale__media--${variant}`;

  if (useVideo) {
    return (
      <video
        ref={variant === "before" ? videoRef : undefined}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={HERO_MEDIA.poster}
        aria-hidden
      >
        <source src={HERO_MEDIA.mp4} type="video/mp4" />
      </video>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={HERO_MEDIA.poster}
      alt=""
      className={className}
      aria-hidden
      loading="lazy"
      decoding="async"
    />
  );
}

type LandingV2HeroUpscaleCompareProps = {
  className?: string;
};

/** Hero before/after — same heroPreviewVideo source, CSS-only contrast preview */
export function LandingV2HeroUpscaleCompare({
  className = "",
}: LandingV2HeroUpscaleCompareProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const [dragging, setDragging] = useState(false);
  const { isMobile } = useLandingViewport();
  const reduceMotion = useReducedMotion();
  const { enableHeroVideo } = useLandingV2Links();

  const useVideo = enableHeroVideo && !reduceMotion;
  const interactive = !reduceMotion;
  const displaySplit = reduceMotion ? STATIC_SPLIT : split;

  const clampSplit = useCallback((value: number) => Math.min(88, Math.max(12, value)), []);

  const updateSplitFromPointer = useCallback(
    (clientX: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setSplit(clampSplit(pct));
    },
    [clampSplit]
  );

  useEffect(() => {
    if (!useVideo) return;
    const before = beforeVideoRef.current;
    const after = afterVideoRef.current;
    if (!before || !after) return;

    const syncAfter = () => {
      if (Math.abs(before.currentTime - after.currentTime) > 0.15) {
        after.currentTime = before.currentTime;
      }
    };

    before.addEventListener("timeupdate", syncAfter);
    return () => before.removeEventListener("timeupdate", syncAfter);
  }, [useVideo]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => updateSplitFromPointer(event.clientX);
    const onUp = () => setDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, updateSplitFromPointer]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!interactive) return;
    event.preventDefault();
    setDragging(true);
    updateSplitFromPointer(event.clientX);
  };

  const rootClass = ["landing-v2-hero-upscale", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} aria-label={COPY.subline}>
      <header className="landing-v2-hero-upscale__header">
        <p className="landing-v2-hero-upscale__kicker">{COPY.kicker}</p>
        <p className="landing-v2-hero-upscale__headline">{COPY.headline}</p>
        <p className="landing-v2-hero-upscale__subline">{COPY.subline}</p>
      </header>

      <div
        ref={stageRef}
        className="landing-v2-hero-upscale__stage"
        style={{ ["--lv2-upscale-split" as string]: `${displaySplit}%` }}
        onMouseEnter={() => {
          if (interactive && !dragging && !isMobile) setSplit(HOVER_SPLIT);
        }}
        onMouseLeave={() => {
          if (interactive && !dragging && !isMobile) setSplit(DEFAULT_SPLIT);
        }}
      >
        <div className="landing-v2-hero-upscale__layer landing-v2-hero-upscale__layer--before">
          <MediaLayer variant="before" useVideo={useVideo} videoRef={beforeVideoRef} />
        </div>

        <div className="landing-v2-hero-upscale__layer landing-v2-hero-upscale__layer--after">
          {useVideo ? (
            <video
              ref={afterVideoRef}
              className="landing-v2-hero-upscale__media landing-v2-hero-upscale__media--after"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={HERO_MEDIA.poster}
              aria-hidden
            >
              <source src={HERO_MEDIA.mp4} type="video/mp4" />
            </video>
          ) : (
            <MediaLayer variant="after" useVideo={false} />
          )}
        </div>

        <div className="landing-v2-hero-upscale__divider" aria-hidden />
        <button
          type="button"
          className="landing-v2-hero-upscale__handle"
          aria-label="Vergleich verschieben"
          onPointerDown={handlePointerDown}
          style={{ left: `var(--lv2-upscale-split)` }}
        >
          <span className="landing-v2-hero-upscale__handle-grip" aria-hidden />
        </button>

        <div className="landing-v2-hero-upscale__labels">
          <div className="landing-v2-hero-upscale__label landing-v2-hero-upscale__label--before">
            <span className="landing-v2-hero-upscale__label-title">{COPY.beforeTitle}</span>
            <span className="landing-v2-hero-upscale__label-meta">{COPY.beforeMeta}</span>
          </div>
          <div className="landing-v2-hero-upscale__label landing-v2-hero-upscale__label--after">
            <span className="landing-v2-hero-upscale__label-title">{COPY.afterTitle}</span>
            <span className="landing-v2-hero-upscale__label-meta landing-v2-hero-upscale__label-meta--accent">
              {COPY.afterMeta}
            </span>
          </div>
        </div>
      </div>

      <p className="landing-v2-hero-upscale__note">{COPY.previewNote}</p>
    </div>
  );
}
