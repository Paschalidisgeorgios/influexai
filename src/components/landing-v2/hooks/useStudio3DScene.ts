"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
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
        const offsetZ = cfg.z - 96;
        const offsetY = cfg.y + 36;

        gsap.set(panel, {
          z: offsetZ,
          rotateY: cfg.rotateY * 1.6,
          rotateX: cfg.rotateX + 10,
          y: offsetY,
          scale: cfg.scale * 0.9,
          transformPerspective: 1500,
          force3D: true,
        });

        gsap.to(panel, {
          z: cfg.z,
          rotateY: cfg.rotateY,
          rotateX: cfg.rotateX,
          y: cfg.y,
          scale: cfg.scale,
          ease: "power2.out",
          scrollTrigger: {
            trigger: panel,
            start: "top 84%",
            end: "top 38%",
            scrub: 0.7,
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, [enabled, sectionRef, sceneRef]);
}
