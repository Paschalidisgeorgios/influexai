"use client";

import { useCallback, useEffect, useState } from "react";
import type { LandingV2AssetSlot } from "@/lib/landing-v2-assets";

type LandingV2AssetImageProps = {
  slot: LandingV2AssetSlot;
  className?: string;
  aspectClassName?: string;
};

export function LandingV2AssetImage({
  slot,
  className = "",
  aspectClassName = "aspect-[16/10]",
}: LandingV2AssetImageProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  const showFallback = useCallback(() => setStatus("fallback"), []);

  useEffect(() => {
    setStatus("loading");
    const img = new Image();
    img.onload = () => setStatus("ready");
    img.onerror = showFallback;
    img.src = slot.primary;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [slot.primary, showFallback]);

  if (status === "fallback") {
    return (
      <div className={`landing-v2-asset-fallback ${aspectClassName} ${className}`}>
        <span className="landing-v2-asset-fallback__label">Asset folgt</span>
        <span className="landing-v2-asset-fallback__title">{slot.label}</span>
        <p className="mt-1 max-w-xs text-sm text-[var(--lv2-text-muted)]">
          Platzhalter — Produktfläche wird aus dem Studio exportiert.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${aspectClassName} ${className}`}>
      {status === "loading" ? (
        <div className="absolute inset-0 animate-pulse bg-white/20" aria-hidden />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slot.primary}
        alt={slot.label}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setStatus("ready")}
        onError={showFallback}
      />
    </div>
  );
}

type LandingV2AssetVideoProps = {
  webm: string;
  mp4: string;
  poster: string;
  studioWebm?: string;
  studioMp4?: string;
  studioPoster?: string;
  label: string;
  className?: string;
};

export function LandingV2AssetVideo({
  webm,
  mp4,
  poster,
  studioWebm,
  studioMp4,
  studioPoster,
  label,
  className = "",
}: LandingV2AssetVideoProps) {
  const [mode, setMode] = useState<"primary" | "studio" | "fallback">("primary");

  const sources =
    mode === "primary"
      ? { webm, mp4, poster }
      : mode === "studio" && studioWebm && studioMp4
        ? { webm: studioWebm, mp4: studioMp4, poster: studioPoster ?? poster }
        : null;

  if (!sources) {
    return (
      <div className={`landing-v2-asset-fallback aspect-[16/9] ${className}`}>
        <span className="landing-v2-asset-fallback__label">Asset folgt</span>
        <span className="landing-v2-asset-fallback__title">{label}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[20px] ${className}`}>
      <video
        key={`${mode}-${sources.mp4}`}
        className="aspect-[16/9] w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={sources.poster}
        onError={() => {
          if (mode === "primary" && studioMp4) setMode("studio");
          else setMode("fallback");
        }}
      >
        <source src={sources.webm} type="video/webm" />
        <source src={sources.mp4} type="video/mp4" />
      </video>
    </div>
  );
}
