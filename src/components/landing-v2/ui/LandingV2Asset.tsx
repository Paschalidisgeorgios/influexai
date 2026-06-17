"use client";

import { useCallback, useEffect, useState } from "react";
import type { LandingV2AssetSlot } from "@/lib/landing-v2-assets";
import { LandingV2Placeholder, type LandingV2PlaceholderVariant } from "./LandingV2Placeholder";

const SLOT_VARIANT: Record<string, LandingV2PlaceholderVariant> = {
  studio: "studio",
  tools: "tools",
  agent: "agent",
  gallery: "gallery",
  "output-image": "campaign-visual",
};

async function assetExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

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
  const [ready, setReady] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);

  const variant = SLOT_VARIANT[slot.id] ?? "campaign-visual";

  useEffect(() => {
    let cancelled = false;
    setExists(null);
    setReady(false);
    void assetExists(slot.primary).then((ok) => {
      if (!cancelled) setExists(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [slot.primary]);

  if (exists === false) {
    return (
      <LandingV2Placeholder
        variant={variant}
        label={slot.placeholderLabel}
        className={className}
        aspectClassName={aspectClassName}
      />
    );
  }

  if (exists !== true) {
    return (
      <LandingV2Placeholder
        variant={variant}
        label={slot.placeholderLabel}
        className={`opacity-70 ${className}`}
        aspectClassName={aspectClassName}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${aspectClassName} ${className}`}>
      {!ready ? (
        <LandingV2Placeholder
          variant={variant}
          label={slot.placeholderLabel}
          aspectClassName="absolute inset-0 h-full w-full"
          className="opacity-70"
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slot.primary}
        alt=""
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setReady(true)}
        onError={() => setExists(false)}
      />
    </div>
  );
}

type LandingV2AssetVideoProps = {
  webm: string;
  mp4: string;
  poster: string;
  placeholderLabel: string;
  variant?: LandingV2PlaceholderVariant;
  className?: string;
};

export function LandingV2AssetVideo({
  webm,
  mp4,
  poster,
  placeholderLabel,
  variant = "hero",
  className = "",
}: LandingV2AssetVideoProps) {
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setExists(null);
    void assetExists(mp4).then((ok) => {
      if (!cancelled) setExists(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [mp4]);

  if (exists !== true) {
    return (
      <LandingV2Placeholder
        variant={variant}
        label={placeholderLabel}
        aspectClassName="aspect-[16/9]"
        className={className}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[20px] ${className}`}>
      <video
        className="aspect-[16/9] w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        onError={() => setExists(false)}
      >
        <source src={webm} type="video/webm" />
        <source src={mp4} type="video/mp4" />
      </video>
    </div>
  );
}
