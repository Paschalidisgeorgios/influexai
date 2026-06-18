"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useHeroVideoParallax } from "../hooks/useHeroVideoParallax";

const video = LANDING_V2_ASSETS.heroPreviewVideo;
const DEFAULT_SPLIT = 50;
const HOVER_SPLIT = 54;

type LandingV2HeroVideoBackgroundProps = {
  sectionRef: RefObject<HTMLElement | null>;
};

/** Preview hero backdrop — same mp4 with in-video before/after compare */
export function LandingV2HeroVideoBackground({
  sectionRef,
}: LandingV2HeroVideoBackgroundProps) {
  const compareRef = useRef<HTMLDivElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const [dragging, setDragging] = useState(false);

  const { isMobile, enableCinematicScroll } = useLandingViewport();
  const reduceMotion = useReducedMotion();
  const { enableHeroVideo, enablePreviewMotion } = useLandingV2Links();

  const showVideo = enableHeroVideo && !isMobile && !reduceMotion;
  const motionEnabled = enablePreviewMotion && enableCinematicScroll && showVideo;
  const interactive = showVideo && !reduceMotion;

  const displaySplit = interactive ? split : DEFAULT_SPLIT;

  useHeroVideoParallax(sectionRef, compareRef, motionEnabled);

  const clampSplit = useCallback((value: number) => Math.min(82, Math.max(38, value)), []);

  const updateSplitFromPointer = useCallback(
    (clientX: number) => {
      const stage = compareRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setSplit(clampSplit(pct));
    },
    [clampSplit]
  );

  useEffect(() => {
    if (!showVideo) return;
    const before = beforeVideoRef.current;
    const after = afterVideoRef.current;
    if (!before || !after) return;

    const syncAfter = () => {
      if (Math.abs(before.currentTime - after.currentTime) > 0.12) {
        after.currentTime = before.currentTime;
      }
    };

    const onLoaded = () => {
      after.currentTime = before.currentTime;
    };

    before.addEventListener("timeupdate", syncAfter);
    before.addEventListener("loadeddata", onLoaded);
    return () => {
      before.removeEventListener("timeupdate", syncAfter);
      before.removeEventListener("loadeddata", onLoaded);
    };
  }, [showVideo]);

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

  const splitStyle = { ["--lv2-hero-split" as string]: `${displaySplit}%` };

  return (
    <div className="landing-v2-hero-video-bg" aria-hidden>
      <div
        ref={compareRef}
        className="landing-v2-hero-video-bg__compare"
        style={splitStyle}
        onMouseEnter={() => {
          if (interactive && !dragging) setSplit(HOVER_SPLIT);
        }}
        onMouseLeave={() => {
          if (interactive && !dragging) setSplit(DEFAULT_SPLIT);
        }}
      >
        <div className="landing-v2-hero-video-bg__layer landing-v2-hero-video-bg__layer--before">
          {showVideo ? (
            <video
              ref={beforeVideoRef}
              className="landing-v2-hero-video-bg__media landing-v2-hero-video-bg__media--before"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={video.poster}
            >
              <source src={video.mp4} type="video/mp4" />
            </video>
          ) : (
            <div
              className="landing-v2-hero-video-bg__poster landing-v2-hero-video-bg__media--before"
              style={{ backgroundImage: `url(${video.poster})` }}
            />
          )}
        </div>

        <div className="landing-v2-hero-video-bg__layer landing-v2-hero-video-bg__layer--after">
          {showVideo ? (
            <video
              ref={afterVideoRef}
              className="landing-v2-hero-video-bg__media landing-v2-hero-video-bg__media--after"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={video.poster}
            >
              <source src={video.mp4} type="video/mp4" />
            </video>
          ) : (
            <div
              className="landing-v2-hero-video-bg__poster landing-v2-hero-video-bg__media--after"
              style={{ backgroundImage: `url(${video.poster})` }}
            />
          )}
        </div>

        <div className="landing-v2-hero-video-bg__divider" />
        <button
          type="button"
          className="landing-v2-hero-video-bg__handle"
          aria-label="Vorher-Nachher-Vergleich verschieben"
          onPointerDown={handlePointerDown}
        >
          <span className="landing-v2-hero-video-bg__handle-grip" aria-hidden />
        </button>

        <div className="landing-v2-hero-video-bg__caption">
          <span className="landing-v2-hero-video-bg__caption-title">Topaz Video Upscale</span>
          <span className="landing-v2-hero-video-bg__caption-meta">Vorher / Nachher</span>
        </div>
      </div>

      <div className="landing-v2-hero-video-bg__scrim" />
    </div>
  );
}
