"use client";

import { useEffect, useRef, useState } from "react";
import { SeamlessLoopVideo } from "@/components/ui/SeamlessLoopVideo";

type LandingFeatureVideoProps = {
  src: string;
  label?: string;
  className?: string;
  aspectClass?: string;
};

export function LandingFeatureVideo({
  src,
  label,
  className = "",
  aspectClass = "aspect-video",
}: LandingFeatureVideoProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.4, rootMargin: "0px 0px -4% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bright = hovered || (inView && coarsePointer);

  return (
    <div
      ref={wrapRef}
      className={`landing-feature-video-wrap relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-950/60 ${aspectClass} ${className}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <SeamlessLoopVideo
        src={src}
        ariaLabel={label}
        playing={inView}
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          bright ? "opacity-100" : "opacity-60"
        }`}
        videoClassName="landing-feature-video h-full w-full object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
        aria-hidden
      />
    </div>
  );
}
