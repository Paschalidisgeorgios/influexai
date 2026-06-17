"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PANEL_3D = [
  { z: 44, rotateY: -4, rotateX: 2, y: 0 },
  { z: 18, rotateY: 3, rotateX: -1, y: 8 },
  { z: 8, rotateY: -2, rotateX: 1, y: -6 },
  { z: 56, rotateY: 2, rotateX: -2, y: 4 },
] as const;

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
        const cfg = PANEL_3D[index] ?? PANEL_3D[0];
        gsap.set(panel, {
          z: cfg.z - 70,
          rotateY: cfg.rotateY * 1.4,
          rotateX: cfg.rotateX + 6,
          y: cfg.y + 24,
          autoAlpha: 0.35,
          transformPerspective: 1200,
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: "top 78%",
          end: "top 28%",
          scrub: 0.55,
        },
      });

      panels.forEach((panel, index) => {
        const cfg = PANEL_3D[index] ?? PANEL_3D[0];
        tl.to(
          panel,
          {
            z: cfg.z,
            rotateY: cfg.rotateY,
            rotateX: cfg.rotateX,
            y: cfg.y,
            autoAlpha: 1,
            duration: 0.25,
            ease: "power2.out",
          },
          index * 0.06
        );
      });
    }, section);

    return () => ctx.revert();
  }, [enabled, sectionRef, sceneRef]);
}
