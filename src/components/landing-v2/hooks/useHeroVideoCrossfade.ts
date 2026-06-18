"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const CROSSFADE_SEC = 1.2;
const LEAD_SEC = 1.25;

export type HeroVideoSlotOpacity = {
  a: number;
  b: number;
};

type UseHeroVideoCrossfadeOptions = {
  enabled: boolean;
  beforeA: RefObject<HTMLVideoElement | null>;
  beforeB: RefObject<HTMLVideoElement | null>;
  afterA: RefObject<HTMLVideoElement | null>;
  afterB: RefObject<HTMLVideoElement | null>;
};

/** Seamless loop via dual same-source layers + opacity crossfade (preview hero only) */
export function useHeroVideoCrossfade({
  enabled,
  beforeA,
  beforeB,
  afterA,
  afterB,
}: UseHeroVideoCrossfadeOptions): HeroVideoSlotOpacity {
  const activeRef = useRef<"a" | "b">("a");
  const crossfadingRef = useRef(false);
  const [slotOpacity, setSlotOpacity] = useState<HeroVideoSlotOpacity>({ a: 1, b: 0 });

  useEffect(() => {
    if (!enabled) return;

    const getSlotVideos = (slot: "a" | "b") => ({
      before: slot === "a" ? beforeA.current : beforeB.current,
      after: slot === "a" ? afterA.current : afterB.current,
    });

    const playPair = async (slot: "a" | "b", time = 0) => {
      const pair = getSlotVideos(slot);
      if (!pair.before || !pair.after) return;
      pair.before.currentTime = time;
      pair.after.currentTime = time;
      await Promise.all([pair.before.play(), pair.after.play()].map((p) => p.catch(() => {})));
    };

    const pausePair = (slot: "a" | "b") => {
      const pair = getSlotVideos(slot);
      pair.before?.pause();
      pair.after?.pause();
      if (pair.before) pair.before.currentTime = 0;
      if (pair.after) pair.after.currentTime = 0;
    };

    const startPlayback = () => {
      activeRef.current = "a";
      crossfadingRef.current = false;
      setSlotOpacity({ a: 1, b: 0 });
      pausePair("b");
      void playPair("a", 0);
    };

    const beginCrossfade = () => {
      if (crossfadingRef.current) return;

      const current = activeRef.current;
      const next: "a" | "b" = current === "a" ? "b" : "a";
      const standby = getSlotVideos(next);
      if (!standby.before || !standby.after) return;

      crossfadingRef.current = true;
      void playPair(next, 0);
      setSlotOpacity({ a: next === "a" ? 1 : 0, b: next === "b" ? 1 : 0 });

      window.setTimeout(() => {
        pausePair(current);
        activeRef.current = next;
        crossfadingRef.current = false;
      }, CROSSFADE_SEC * 1000);
    };

    const onTimeUpdate = (event: Event) => {
      if (crossfadingRef.current) return;

      const target = event.target as HTMLVideoElement;
      const current = activeRef.current;
      const leader = getSlotVideos(current).before;
      if (!leader || target !== leader) return;

      const follower = getSlotVideos(current).after;
      if (follower && Math.abs(follower.currentTime - leader.currentTime) > 0.1) {
        follower.currentTime = leader.currentTime;
      }

      const duration = leader.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const remaining = duration - leader.currentTime;
      if (remaining <= LEAD_SEC && remaining > 0.04) {
        beginCrossfade();
      }
    };

    const leaderA = beforeA.current;
    const leaderB = beforeB.current;

    const onReady = () => startPlayback();

    leaderA?.addEventListener("loadedmetadata", onReady);
    leaderA?.addEventListener("timeupdate", onTimeUpdate);
    leaderB?.addEventListener("timeupdate", onTimeUpdate);

    if (leaderA && leaderA.readyState >= 1) {
      startPlayback();
    }

    return () => {
      leaderA?.removeEventListener("loadedmetadata", onReady);
      leaderA?.removeEventListener("timeupdate", onTimeUpdate);
      leaderB?.removeEventListener("timeupdate", onTimeUpdate);
      pausePair("a");
      pausePair("b");
      crossfadingRef.current = false;
    };
  }, [enabled, beforeA, beforeB, afterA, afterB]);

  return slotOpacity;
}
