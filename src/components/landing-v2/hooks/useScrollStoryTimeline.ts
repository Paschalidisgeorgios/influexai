"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { STORY_PANEL_DEPTH, STORY_PIN_SCROLL_VH } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

const depth = STORY_PANEL_DEPTH;

type DepthState = keyof typeof STORY_PANEL_DEPTH;

function setPanelDepth(panel: HTMLElement, state: DepthState) {
  const d = depth[state];
  gsap.set(panel, {
    autoAlpha: d.autoAlpha,
    scale: d.scale,
    z: d.z,
    rotateX: d.rotateX,
    rotateY: d.rotateY,
    transformPerspective: 1400,
    transformOrigin: "50% 50%",
    force3D: true,
  });
}

export function useScrollStoryTimeline(
  pinRef: RefObject<HTMLDivElement | null>,
  panelsRef: RefObject<HTMLDivElement | null>,
  stationCount: number,
  enabled: boolean,
  onActiveChange: (index: number) => void
) {
  useEffect(() => {
    const pin = pinRef.current;
    const panels = panelsRef.current;
    if (!enabled || !pin || !panels || stationCount < 2) return;

    const panelEls = Array.from(
      panels.querySelectorAll<HTMLElement>("[data-story-panel]")
    );
    if (panelEls.length < 2) return;

    const ctx = gsap.context(() => {
      panelEls.forEach((panel, index) => {
        setPanelDepth(panel, index === 0 ? "active" : "inactive");
        const asset = panel.querySelector<HTMLElement>("[data-story-asset]");
        if (asset) {
          gsap.set(asset, {
            z: index === 0 ? 24 : -40,
            y: index === 0 ? 0 : 24,
            scale: index === 0 ? 1 : 0.96,
            opacity: index === 0 ? 1 : 0.5,
            transformPerspective: 1400,
            force3D: true,
          });
        }
      });

      const step = 1 / (panelEls.length - 1);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: `+=${stationCount * STORY_PIN_SCROLL_VH}%`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(
              stationCount - 1,
              Math.floor(self.progress * stationCount)
            );
            onActiveChange(idx);
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
            autoAlpha: depth.previous.autoAlpha,
            scale: depth.previous.scale,
            z: depth.previous.z,
            rotateX: depth.previous.rotateX,
            duration: 0.18,
            ease: "power2.inOut",
          },
          at
        ).to(
          prev,
          {
            autoAlpha: depth.hidden.autoAlpha,
            scale: depth.hidden.scale,
            z: depth.hidden.z,
            rotateX: depth.hidden.rotateX,
            duration: 0.22,
            ease: "power2.inOut",
          },
          at + 0.1
        );

        tl.fromTo(
          current,
          {
            autoAlpha: depth.inactive.autoAlpha,
            scale: depth.inactive.scale,
            z: depth.inactive.z,
            rotateX: depth.inactive.rotateX,
            immediateRender: false,
          },
          {
            autoAlpha: depth.active.autoAlpha,
            scale: depth.active.scale,
            z: depth.active.z,
            rotateX: depth.active.rotateX,
            duration: 0.28,
            ease: "power3.out",
          },
          at + 0.06
        );

        const asset = current.querySelector<HTMLElement>("[data-story-asset]");
        if (asset) {
          tl.fromTo(
            asset,
            { z: -40, y: 24, scale: 0.96, opacity: 0.5 },
            { z: 24, y: 0, scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" },
            at + 0.08
          );
        }

        for (let j = i + 1; j < panelEls.length; j++) {
          tl.set(
            panelEls[j],
            {
              autoAlpha: depth.inactive.autoAlpha,
              scale: depth.inactive.scale,
              z: depth.inactive.z,
              rotateX: depth.inactive.rotateX,
            },
            at
          );
        }
      }
    }, pin);

    return () => ctx.revert();
  }, [enabled, pinRef, panelsRef, stationCount, onActiveChange]);
}
