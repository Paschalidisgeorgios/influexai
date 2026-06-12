"use client";

import { useState, useEffect } from "react";

export function useScrollDepth(maxScroll = 400) {
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setDepth(Math.min(window.scrollY / maxScroll, 1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [maxScroll]);

  return depth;
}
