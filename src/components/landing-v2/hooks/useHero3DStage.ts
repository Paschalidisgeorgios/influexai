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
  enableParallax: boolean;
  enableMouse: boolean;
};

export function useHero3DStage({
  sectionRef,
  stageRef,
  panelRef,
  backPlateRef,
  enableParallax,
  enableMouse,
}: UseHero3DStageOptions) {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const panel = panelRef.current;
    const backPlate = backPlateRef.current;
    if (!section || !stage || !panel) return;

    const onMove = (event: MouseEvent) => {
      if (!enableMouse || !backPlate) return;
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(panel, {
        rotateY: x * 4,
        rotateX: -1.5 + -y * 2.5,
        duration: 0.55,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(backPlate, {
        rotateY: x * -2,
        rotateX: 4 + y * 1.2,
        duration: 0.65,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onLeave = () => {
      if (!enableMouse || !backPlate) return;
      gsap.to(panel, {
        rotateY: 0,
        rotateX: -1.5,
        duration: 0.75,
        ease: "power2.out",
      });
      gsap.to(backPlate, {
        rotateY: 0,
        rotateX: 4,
        duration: 0.75,
        ease: "power2.out",
      });
    };

    if (enableMouse && backPlate) {
      stage.addEventListener("mousemove", onMove);
      stage.addEventListener("mouseleave", onLeave);
    }

    const ctx = gsap.context(() => {
      if (backPlate && enableParallax) {
        gsap.set(backPlate, { z: -100, rotateX: 4, transformPerspective: 1200 });
      }
      if (enableParallax) {
        gsap.set(panel, { z: 40, rotateX: -1.5, transformPerspective: 1200 });

        gsap.to(panel, {
          y: -14,
          z: 24,
          scale: 0.99,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 0.9,
          },
        });

        if (backPlate) {
          gsap.to(backPlate, {
            y: 16,
            z: -130,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: 0.9,
            },
          });
        }
      }
    }, section);

    return () => {
      if (enableMouse) {
        stage.removeEventListener("mousemove", onMove);
        stage.removeEventListener("mouseleave", onLeave);
      }
      ctx.revert();
    };
  }, [enableParallax, enableMouse, sectionRef, stageRef, panelRef, backPlateRef]);
}
