"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { STUDIO_PANEL_DEPTH } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

export function useStudio3DScene(
  sectionRef: RefObject<HTMLElement | null>,
  sceneRef: RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    if (!enabled || !section || !scene) return;

    const panels = scene.querySelectorAll<HTMLElement>("[data-studio-panel]");

    const ctx = gsap.context(() => {
      panels.forEach((panel, index) => {
        const cfg = STUDIO_PANEL_DEPTH[index] ?? STUDIO_PANEL_DEPTH[0];
        gsap.set(panel, {
          z: cfg.z - 88,
          rotateY: cfg.rotateY * 1.35,
          rotateX: cfg.rotateX + 8,
          y: cfg.y + 28,
          scale: cfg.scale * 0.94,
          autoAlpha: 0.32,
          transformPerspective: 1400,
          force3D: true,
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: "top 76%",
          end: "top 24%",
          scrub: 0.85,
        },
      });

      panels.forEach((panel, index) => {
        const cfg = STUDIO_PANEL_DEPTH[index] ?? STUDIO_PANEL_DEPTH[0];
        tl.to(
          panel,
          {
            z: cfg.z,
            rotateY: cfg.rotateY,
            rotateX: cfg.rotateX,
            y: cfg.y,
            scale: cfg.scale,
            autoAlpha: 1,
            duration: 0.28,
            ease: "power2.out",
          },
          index * 0.08
        );
      });
    }, section);

    return () => ctx.revert();
  }, [enabled, sectionRef, sceneRef]);
}
