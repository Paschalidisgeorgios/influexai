"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pull = useRef(0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPulling(false);
      pull.current = 0;
    }
  }, [onRefresh]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 8) return;
      startY.current = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 8) return;
      const y = e.touches[0]?.clientY ?? 0;
      const delta = y - startY.current;
      if (delta > 0 && delta < 120) {
        pull.current = delta;
        setPulling(delta > 56);
      }
    };

    const onTouchEnd = () => {
      if (pull.current > 56) void handleRefresh();
      else {
        setPulling(false);
        pull.current = 0;
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleRefresh]);

  return { pulling, refreshing };
}
