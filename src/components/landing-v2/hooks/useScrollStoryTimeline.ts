"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { STORY_ASSET_DEPTH, STORY_PIN_SCROLL_VH } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

const depth = STORY_ASSET_DEPTH;

function showOnly(panelEls: HTMLElement[], activeIndex: number) {
  panelEls.forEach((panel, index) => {
    gsap.set(panel, {
      autoAlpha: index === activeIndex ? depth.active.autoAlpha : depth.hidden.autoAlpha,
      scale: index === activeIndex ? depth.active.scale : depth.hidden.scale,
      z: index === activeIndex ? depth.active.z : depth.hidden.z,
      pointerEvents: index === activeIndex ? "auto" : "none",
    });
  });
}

export function useScrollStoryTimeline(
  pinRef: RefObject<HTMLDivElement | null>,
  stageRef: RefObject<HTMLDivElement | null>,
  stationCount: number,
  enabled: boolean,
  onActiveChange: (index: number) => void
) {
  useEffect(() => {
    const pin = pinRef.current;
    const stage = stageRef.current;
    if (!enabled || !pin || !stage || stationCount < 2) return;

    const panelEls = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-story-asset-panel]")
    );
    if (panelEls.length < 2) return;

    const ctx = gsap.context(() => {
      showOnly(panelEls, 0);

      const step = 1 / (panelEls.length - 1);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: `+=${stationCount * STORY_PIN_SCROLL_VH}%`,
          pin: true,
          pinSpacing: true,
          scrub: 0.75,
          anticipatePin: 0,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(
              stationCount - 1,
              Math.floor(self.progress * stationCount)
            );
            onActiveChange(idx);
          },
          onLeave: () => {
            showOnly(panelEls, panelEls.length - 1);
          },
          onLeaveBack: () => {
            showOnly(panelEls, 0);
          },
        },
      });

      for (let i = 1; i < panelEls.length; i++) {
        const at = (i - 1) * step;
        const prev = panelEls[i - 1];
        const current = panelEls[i];

        tl.to(
          prev,
          {
            autoAlpha: depth.hidden.autoAlpha,
            scale: depth.hidden.scale,
            z: depth.hidden.z,
            duration: 0.2,
            ease: "power2.inOut",
          },
          at
        ).fromTo(
          current,
          {
            autoAlpha: depth.hidden.autoAlpha,
            scale: depth.hidden.scale,
            z: depth.hidden.z,
            immediateRender: false,
          },
          {
            autoAlpha: depth.active.autoAlpha,
            scale: depth.active.scale,
            z: depth.active.z,
            duration: 0.28,
            ease: "power2.out",
          },
          at + 0.06
        );
      }
    }, pin);

    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);

    return () => {
      window.clearTimeout(refreshTimer);
      ctx.revert();
      panelEls.forEach((panel) => {
        gsap.set(panel, { clearProps: "all" });
      });
      ScrollTrigger.refresh();
    };
  }, [enabled, pinRef, stageRef, stationCount, onActiveChange]);
}
