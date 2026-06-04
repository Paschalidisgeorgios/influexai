"use client";

import { useEffect, useRef } from "react";
import { trackAbEvent, type AbVariant } from "@/lib/ab-tracking";

export function ABTracker({ variant }: { variant: AbVariant }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void trackAbEvent("view", variant);
  }, [variant]);

  return null;
}
