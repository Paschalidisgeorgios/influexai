"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useHeroVideoParallax } from "../hooks/useHeroVideoParallax";
import { useHeroVideoCrossfade } from "../hooks/useHeroVideoCrossfade";

const video = LANDING_V2_ASSETS.heroPreviewVideo;
const DEFAULT_SPLIT = 50;
const HOVER_SPLIT = 54;

type LandingV2HeroVideoBackgroundProps = {
  sectionRef: RefObject<HTMLElement | null>;
};

type CrossfadeVideoStackProps = {
  slotOpacity: { a: number; b: number };
  filterClass: "before" | "after";
  videoARef: RefObject<HTMLVideoElement | null>;
  videoBRef: RefObject<HTMLVideoElement | null>;
};

function CrossfadeVideoStack({
  slotOpacity,
  filterClass,
  videoARef,
  videoBRef,
}: CrossfadeVideoStackProps) {
  const mediaClass =
    filterClass === "before"
      ? "landing-v2-hero-video-bg__media--before"
      : "landing-v2-hero-video-bg__media--after";

  return (
    <div className="landing-v2-hero-video-bg__media-stack">
      <video
        ref={videoARef}
        className={`landing-v2-hero-video-bg__media ${mediaClass}`}
        style={{ opacity: slotOpacity.a }}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={video.poster}
      >
        <source src={video.mp4} type="video/mp4" />
      </video>
      <video
        ref={videoBRef}
        className={`landing-v2-hero-video-bg__media ${mediaClass}`}
        style={{ opacity: slotOpacity.b }}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={video.poster}
      >
        <source src={video.mp4} type="video/mp4" />
      </video>
    </div>
  );
}

function PosterStack({ filterClass }: { filterClass: "before" | "after" }) {
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

/** Preview hero backdrop — same mp4 with in-video before/after compare */
export function LandingV2HeroVideoBackground({
  sectionRef,
}: LandingV2HeroVideoBackgroundProps) {
  const compareRef = useRef<HTMLDivElement>(null);
  const beforeVideoARef = useRef<HTMLVideoElement>(null);
  const beforeVideoBRef = useRef<HTMLVideoElement>(null);
  const afterVideoARef = useRef<HTMLVideoElement>(null);
  const afterVideoBRef = useRef<HTMLVideoElement>(null);
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const [dragging, setDragging] = useState(false);

  const { isMobile, enableCinematicScroll } = useLandingViewport();
  const reduceMotion = useReducedMotion();
  const { enableHeroVideo, enablePreviewMotion } = useLandingV2Links();

  const showVideo = enableHeroVideo && !isMobile && !reduceMotion;
  const motionEnabled = enablePreviewMotion && enableCinematicScroll && showVideo;
  const interactive = showVideo && !reduceMotion;

  const displaySplit = interactive ? split : DEFAULT_SPLIT;

  const slotOpacity = useHeroVideoCrossfade({
    enabled: showVideo,
    beforeA: beforeVideoARef,
    beforeB: beforeVideoBRef,
    afterA: afterVideoARef,
    afterB: afterVideoBRef,
  });

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
            <CrossfadeVideoStack
              slotOpacity={slotOpacity}
              filterClass="before"
              videoARef={beforeVideoARef}
              videoBRef={beforeVideoBRef}
            />
          ) : (
            <PosterStack filterClass="before" />
          )}
        </div>

        <div className="landing-v2-hero-video-bg__layer landing-v2-hero-video-bg__layer--after">
          {showVideo ? (
            <CrossfadeVideoStack
              slotOpacity={slotOpacity}
              filterClass="after"
              videoARef={afterVideoARef}
              videoBRef={afterVideoBRef}
            />
          ) : (
            <PosterStack filterClass="after" />
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
