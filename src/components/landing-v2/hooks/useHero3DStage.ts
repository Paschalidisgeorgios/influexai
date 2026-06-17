"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type UseHero3DStageOptions = {
  sectionRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  backPlateRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
};

export function useHero3DStage({
  sectionRef,
  stageRef,
  panelRef,
  backPlateRef,
  enabled,
}: UseHero3DStageOptions) {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const panel = panelRef.current;
    const backPlate = backPlateRef.current;
    if (!enabled || !section || !stage || !panel || !backPlate) return;

    const onMove = (event: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(panel, {
        rotateY: x * 5,
        rotateX: -2 + -y * 3.5,
        duration: 0.55,
        ease: "power2.out",
      });
      gsap.to(backPlate, {
        rotateY: x * -2.5,
        rotateX: 5 + y * 1.5,
        duration: 0.65,
        ease: "power2.out",
      });
    };

    const onLeave = () => {
      gsap.to(panel, {
        rotateY: 0,
        rotateX: -2,
        duration: 0.75,
        ease: "power2.out",
      });
      gsap.to(backPlate, {
        rotateY: 0,
        rotateX: 5,
        duration: 0.75,
        ease: "power2.out",
      });
    };

    stage.addEventListener("mousemove", onMove);
    stage.addEventListener("mouseleave", onLeave);

    const ctx = gsap.context(() => {
      gsap.set(backPlate, { z: -90, rotateX: 5, transformPerspective: 1100 });
      gsap.set(panel, { z: 36, rotateX: -2, transformPerspective: 1100 });

      gsap.to(panel, {
        y: -28,
        z: 52,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      gsap.to(backPlate, {
        y: 12,
        z: -110,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }, section);

    return () => {
      stage.removeEventListener("mousemove", onMove);
      stage.removeEventListener("mouseleave", onLeave);
      ctx.revert();
    };
  }, [enabled, sectionRef, stageRef, panelRef, backPlateRef]);
}
