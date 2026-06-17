"use client";

import { useRef } from "react";
import { LANDING_V2_MEDIA_STAGE } from "@/lib/landing-v2-media-stage";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useMediaStageScroll } from "../hooks/useMediaStageScroll";

const assets = LANDING_V2_MEDIA_STAGE;

/** Fixed cinematic backdrop — background only, no content transforms (preview only) */
export function LandingV2MediaStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);

  const { isMobile, enableCinematicScroll } = useLandingViewport();
  const reduceMotion = useReducedMotion();
  const { mode, enablePreviewMotion, enableHeroVideo } = useLandingV2Links();

  const isPreview = mode === "preview";
  const showVideo =
    isPreview && enableHeroVideo && !isMobile && !reduceMotion;
  const motionEnabled =
    isPreview && enablePreviewMotion && enableCinematicScroll && !isMobile;

  useMediaStageScroll({
    stageRef,
    scrimRef,
    primaryVideoRef,
    secondaryVideoRef,
    enabled: motionEnabled,
  });

  if (!isPreview) return null;

  if (!showVideo) {
    return (
      <div
        ref={stageRef}
        className="landing-v2-media-stage landing-v2-media-stage--poster"
        aria-hidden
        style={{ backgroundImage: `url(${assets.mobilePoster})` }}
      >
        <div ref={scrimRef} className="landing-v2-media-stage__scrim" />
      </div>
    );
  }

  return (
    <div ref={stageRef} className="landing-v2-media-stage" aria-hidden>
      <div
        className="landing-v2-media-stage__layer landing-v2-media-stage__layer--hero"
        data-media-layer="hero"
      >
        <video
          ref={primaryVideoRef}
          className="landing-v2-media-stage__video landing-v2-media-stage__video--primary"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={assets.primary.poster}
        >
          <source src={assets.primary.webm} type="video/webm" />
          <source src={assets.primary.mp4} type="video/mp4" />
        </video>
      </div>

      <div
        className="landing-v2-media-stage__layer landing-v2-media-stage__layer--system"
        data-media-layer="system"
      >
        <div className="landing-v2-media-stage__gradient landing-v2-media-stage__gradient--system" />
      </div>

      <div
        className="landing-v2-media-stage__layer landing-v2-media-stage__layer--workflow"
        data-media-layer="workflow"
      >
        <video
          ref={secondaryVideoRef}
          className="landing-v2-media-stage__video landing-v2-media-stage__video--secondary"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={assets.workflow.poster}
        >
          <source src={assets.workflow.webm} type="video/webm" />
          <source src={assets.workflow.mp4} type="video/mp4" />
          <source src={assets.workflow.fallbackWebm} type="video/webm" />
          <source src={assets.workflow.fallbackMp4} type="video/mp4" />
        </video>
      </div>

      <div
        className="landing-v2-media-stage__layer landing-v2-media-stage__layer--studio"
        data-media-layer="studio"
        style={{ backgroundImage: `url(${assets.studio.image})` }}
      />

      <div
        className="landing-v2-media-stage__layer landing-v2-media-stage__layer--outputs"
        data-media-layer="outputs"
        style={{ backgroundImage: `url(${assets.outputs.image})` }}
      >
        <video
          className="landing-v2-media-stage__video landing-v2-media-stage__video--outputs"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={assets.outputs.poster}
        >
          <source src={assets.outputs.webm} type="video/webm" />
          <source src={assets.outputs.mp4} type="video/mp4" />
          <source src={assets.outputs.fallbackMp4} type="video/mp4" />
        </video>
      </div>

      <div ref={scrimRef} className="landing-v2-media-stage__scrim" />
      <div className="landing-v2-media-stage__vignette" />
    </div>
  );
}
