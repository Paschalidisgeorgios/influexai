"use client";

import { useEffect, type RefObject } from "react";

type UseHeroVideoCompareSyncOptions = {
  enabled: boolean;
  beforeRef: RefObject<HTMLVideoElement | null>;
  afterRef: RefObject<HTMLVideoElement | null>;
};

/** Keep before/after hero compare videos in sync (preview hero only) */
export function useHeroVideoCompareSync({
  enabled,
  beforeRef,
  afterRef,
}: UseHeroVideoCompareSyncOptions) {
  useEffect(() => {
    if (!enabled) return;

    const before = beforeRef.current;
    const after = afterRef.current;
    if (!before || !after) return;

    let started = false;

    const syncAfterToBefore = () => {
      if (Math.abs(after.currentTime - before.currentTime) > 0.08) {
        after.currentTime = before.currentTime;
      }
    };

    const startBoth = async () => {
      if (started) return;
      started = true;

      const time = before.currentTime || 0;
      after.currentTime = time;
      before.currentTime = time;

      await Promise.all(
        [before.play(), after.play()].map((play) => play.catch(() => {}))
      );
    };

    const onBeforeTimeUpdate = () => syncAfterToBefore();

    before.addEventListener("loadedmetadata", startBoth);
    before.addEventListener("canplay", startBoth);
    before.addEventListener("timeupdate", onBeforeTimeUpdate);

    if (before.readyState >= 1) {
      void startBoth();
    }

    return () => {
      before.removeEventListener("loadedmetadata", startBoth);
      before.removeEventListener("canplay", startBoth);
      before.removeEventListener("timeupdate", onBeforeTimeUpdate);
      before.pause();
      after.pause();
      started = false;
    };
  }, [enabled, beforeRef, afterRef]);
}
