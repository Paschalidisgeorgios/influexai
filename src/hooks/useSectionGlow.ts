"use client";

import { useEffect, useState } from "react";
import {
  LANDING_GLOW_DATA_ATTR,
  LANDING_GLOW_OBSERVER_THRESHOLDS,
  LANDING_GLOW_SECTIONS,
  LANDING_GLOW_THRESHOLD,
  type LandingGlowSection,
} from "@/lib/landing-section-glow";

function pickActiveSection(ratios: Map<LandingGlowSection, number>): LandingGlowSection | null {
  let best: LandingGlowSection | null = null;
  let bestRatio = 0;

  for (const section of LANDING_GLOW_SECTIONS) {
    const ratio = ratios.get(section) ?? 0;
    if (ratio >= LANDING_GLOW_THRESHOLD && ratio > bestRatio) {
      best = section;
      bestRatio = ratio;
    }
  }

  return best;
}

export function useSectionGlow(): { activeSection: LandingGlowSection | null } {
  const [activeSection, setActiveSection] = useState<LandingGlowSection | null>(null);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(`[${LANDING_GLOW_DATA_ATTR}]`)
    );

    if (elements.length === 0) return;

    const ratios = new Map<LandingGlowSection, number>();
    let rafId: number | null = null;

    const flush = () => {
      rafId = null;
      const next = pickActiveSection(ratios);
      setActiveSection((prev) => (prev === next ? prev : next));
    };

    const scheduleFlush = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(flush);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const section = entry.target.getAttribute(LANDING_GLOW_DATA_ATTR) as LandingGlowSection | null;
          if (!section || !LANDING_GLOW_SECTIONS.includes(section)) continue;
          ratios.set(section, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        scheduleFlush();
      },
      { threshold: [...LANDING_GLOW_OBSERVER_THRESHOLDS] }
    );

    for (const el of elements) observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return { activeSection };
}
