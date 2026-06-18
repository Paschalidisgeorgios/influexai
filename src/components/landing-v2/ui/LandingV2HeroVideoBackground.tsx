"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useHeroVideoParallax } from "../hooks/useHeroVideoParallax";
import { useHeroVideoCompareSync } from "../hooks/useHeroVideoCompareSync";

const video = LANDING_V2_ASSETS.heroPreviewVideo;
const DEFAULT_SPLIT = 50;
const SPLIT_MIN = 8;
const SPLIT_MAX = 92;

type LandingV2HeroVideoBackgroundProps = {
  sectionRef: RefObject<HTMLElement | null>;
};

type CompareVideoProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  filterClass: "before" | "after";
};

function CompareVideo({ videoRef, filterClass }: CompareVideoProps) {
  const mediaClass =
    filterClass === "before"
      ? "landing-v2-hero-video-bg__media--before"
      : "landing-v2-hero-video-bg__media--after";

  return (
    <video
      ref={videoRef}
      className={`landing-v2-hero-video-bg__media ${mediaClass}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={video.poster}
    >
      <source src={video.mp4} type="video/mp4" />
    </video>
  );
}

function PosterFallback({ filterClass }: { filterClass: "before" | "after" }) {
  const mediaClass =
    filterClass === "before"
      ? "landing-v2-hero-video-bg__media--before"
      : "landing-v2-hero-video-bg__media--after";

  return (
    <div className="landing-v2-hero-video-bg__poster-wrap">
      <div
        className={`landing-v2-hero-video-bg__poster ${mediaClass}`}
        style={{ backgroundImage: `url(${video.poster})` }}
      />
      <div className="landing-v2-hero-video-bg__poster-gradient" aria-hidden />
    </div>
  );
}

/** Preview hero backdrop — same mp4 with draggable before/after compare */
export function LandingV2HeroVideoBackground({
  sectionRef,
}: LandingV2HeroVideoBackgroundProps) {
  const compareRef = useRef<HTMLDivElement>(null);
  const sliderZoneRef = useRef<HTMLDivElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);
  const [sliderPosition, setSliderPosition] = useState(DEFAULT_SPLIT);
  const [dragging, setDragging] = useState(false);

  const { isMobile, enableCinematicScroll } = useLandingViewport();
  const reduceMotion = useReducedMotion();
  const { enableHeroVideo, enablePreviewMotion } = useLandingV2Links();

  const showVideo = enableHeroVideo && !reduceMotion;
  const motionEnabled = enablePreviewMotion && enableCinematicScroll && showVideo;
  const interactive = showVideo && !isMobile;

  const displaySplit = interactive ? sliderPosition : DEFAULT_SPLIT;

  useHeroVideoCompareSync({
    enabled: showVideo,
    beforeRef: beforeVideoRef,
    afterRef: afterVideoRef,
  });

  useHeroVideoParallax(sectionRef, compareRef, motionEnabled);

  const clampSplit = useCallback(
    (value: number) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value)),
    []
  );

  const updateSplitFromPointer = useCallback(
    (clientX: number) => {
      const stage = compareRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setSliderPosition(clampSplit(pct));
    },
    [clampSplit]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateSplitFromPointer(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !dragging) return;
    updateSplitFromPointer(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const splitStyle = { ["--lv2-hero-split" as string]: `${displaySplit}%` };

  return (
    <div className="landing-v2-hero-video-bg" aria-hidden>
      <div
        ref={compareRef}
        className={`landing-v2-hero-video-bg__compare${
          dragging ? " landing-v2-hero-video-bg__compare--dragging" : ""
        }`}
        style={splitStyle}
      >
        <div className="landing-v2-hero-video-bg__layer landing-v2-hero-video-bg__layer--before">
          {showVideo ? (
            <CompareVideo videoRef={beforeVideoRef} filterClass="before" />
          ) : (
            <PosterFallback filterClass="before" />
          )}
        </div>

        <div className="landing-v2-hero-video-bg__layer landing-v2-hero-video-bg__layer--after">
          {showVideo ? (
            <CompareVideo videoRef={afterVideoRef} filterClass="after" />
          ) : (
            <PosterFallback filterClass="after" />
          )}
        </div>

        <div className="landing-v2-hero-video-bg__divider" />
        <div className="landing-v2-hero-video-bg__handle" aria-hidden>
          <span className="landing-v2-hero-video-bg__handle-grip" />
        </div>

        <div
          ref={sliderZoneRef}
          className="landing-v2-hero-video-bg__slider-zone"
          role="slider"
          aria-label="Vorher-Nachher-Vergleich verschieben"
          aria-valuemin={SPLIT_MIN}
          aria-valuemax={SPLIT_MAX}
          aria-valuenow={Math.round(displaySplit)}
          aria-valuetext={`${Math.round(displaySplit)} Prozent Nachher`}
          tabIndex={interactive ? 0 : -1}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <span className="landing-v2-hero-video-bg__edge-label landing-v2-hero-video-bg__edge-label--before">
            Vorher
          </span>
          <span className="landing-v2-hero-video-bg__edge-label landing-v2-hero-video-bg__edge-label--after">
            Nachher
          </span>
        </div>

        <div className="landing-v2-hero-video-bg__caption">
          <span className="landing-v2-hero-video-bg__caption-title">Topaz Video Upscale</span>
          <span className="landing-v2-hero-video-bg__caption-meta">Vorher / Nachher</span>
        </div>
      </div>

      <div className="landing-v2-hero-video-bg__scrim" />
    </div>
  );
}
