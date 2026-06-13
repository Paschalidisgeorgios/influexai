"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

type SeamlessLoopVideoProps = {
  src: string;
  className?: string;
  videoClassName?: string;
  ariaLabel?: string;
  /** Crossfade duration in ms when looping. */
  crossfadeMs?: number;
  /** Seconds before clip end to start crossfade. */
  leadSeconds?: number;
  autoPlay?: boolean;
  /** When false, both layers pause (e.g. off-screen). Defaults to autoPlay. */
  playing?: boolean;
};

function sharedVideoProps(autoPlay: boolean) {
  return {
    muted: true as const,
    playsInline: true as const,
    preload: "auto" as const,
    autoPlay,
    disablePictureInPicture: true,
  };
}

export function SeamlessLoopVideo({
  src,
  className = "",
  videoClassName = "",
  ariaLabel,
  crossfadeMs = 520,
  leadSeconds = 0.45,
  autoPlay = true,
  playing,
}: SeamlessLoopVideoProps) {
  const reduceMotion = useReducedMotion();
  const isPlaying = playing ?? autoPlay;
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef<"a" | "b">("a");
  const crossfadingRef = useRef(false);
  const [frontLayer, setFrontLayer] = useState<"a" | "b">("a");

  const bootstrap = useCallback(() => {
    crossfadingRef.current = false;
    activeRef.current = "a";
    setFrontLayer("a");

    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    a.load();
    b.load();
    b.pause();
    b.currentTime = 0;

    if (autoPlay) {
      void a.play().catch(() => {});
    }
  }, [autoPlay]);

  useEffect(() => {
    if (reduceMotion) return;
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    if (!isPlaying) {
      a.pause();
      b.pause();
      return;
    }

    const active = activeRef.current === "a" ? a : b;
    void active.play().catch(() => {});
  }, [isPlaying, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    bootstrap();
  }, [src, bootstrap, reduceMotion]);

  const handleTimeUpdate = useCallback(
    (which: "a" | "b") => {
      if (crossfadingRef.current || activeRef.current !== which) return;

      const front = which === "a" ? videoARef.current : videoBRef.current;
      const back = which === "a" ? videoBRef.current : videoARef.current;
      if (!front || !back || !Number.isFinite(front.duration) || front.duration <= 0.2) {
        return;
      }

      const lead = Math.min(leadSeconds, Math.max(0.12, front.duration * 0.1));
      const remaining = front.duration - front.currentTime;
      if (remaining > lead || remaining <= 0.04) return;

      crossfadingRef.current = true;
      back.currentTime = 0;
      void back.play().catch(() => {});

      const nextFront: "a" | "b" = which === "a" ? "b" : "a";
      activeRef.current = nextFront;
      setFrontLayer(nextFront);

      window.setTimeout(() => {
        front.pause();
        front.currentTime = 0;
        crossfadingRef.current = false;
      }, crossfadeMs);
    },
    [crossfadeMs, leadSeconds]
  );

  if (reduceMotion) {
    return (
      <div className={className}>
        <video
          src={src}
          aria-label={ariaLabel}
          className={videoClassName}
          loop
          {...sharedVideoProps(autoPlay && isPlaying)}
        />
      </div>
    );
  }

  const fadeStyle = {
    transition: `opacity ${crossfadeMs}ms ease-in-out`,
  };

  return (
    <div className={`seamless-loop-video ${className}`}>
      <video
        ref={videoARef}
        src={src}
        aria-label={ariaLabel}
        aria-hidden={frontLayer !== "a"}
        className={`seamless-loop-video__layer ${videoClassName}`}
        onTimeUpdate={() => handleTimeUpdate("a")}
        style={{
          ...fadeStyle,
          opacity: frontLayer === "a" ? 1 : 0,
          zIndex: frontLayer === "a" ? 2 : 1,
        }}
        {...sharedVideoProps(autoPlay)}
      />
      <video
        ref={videoBRef}
        src={src}
        aria-hidden={frontLayer !== "b"}
        className={`seamless-loop-video__layer ${videoClassName}`}
        onTimeUpdate={() => handleTimeUpdate("b")}
        style={{
          ...fadeStyle,
          opacity: frontLayer === "b" ? 1 : 0,
          zIndex: frontLayer === "b" ? 2 : 1,
        }}
        {...sharedVideoProps(false)}
      />
    </div>
  );
}
