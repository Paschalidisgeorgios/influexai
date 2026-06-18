"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useProof3DScene(
  sectionRef: RefObject<HTMLElement | null>,
  sceneRef: RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    if (!enabled || !section || !scene) return;

    const visual = scene.querySelector<HTMLElement>("[data-proof-visual]");
    const motion = scene.querySelector<HTMLElement>("[data-proof-motion]");

    const ctx = gsap.context(() => {
      if (visual) {
        gsap.set(visual, { z: -40, rotateY: -3, rotateX: 3, transformPerspective: 1100 });
      }
      if (motion) {
        gsap.set(motion, { z: 28, rotateY: 4, rotateX: -2, transformPerspective: 1100 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: "top 82%",
          end: "top 35%",
          scrub: 0.5,
        },
      });

      if (visual) {
        tl.to(visual, { z: 12, rotateY: 0, rotateX: 0, duration: 0.5, ease: "power2.out" }, 0);
      }
      if (motion) {
        tl.to(motion, { z: 36, rotateY: 0, rotateX: 0, duration: 0.5, ease: "power2.out" }, 0.08);
      }
    }, section);

    return () => ctx.revert();
  }, [enabled, sectionRef, sceneRef]);
}
