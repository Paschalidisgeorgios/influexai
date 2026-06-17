"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_PARALLAX } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

type UseHero3DStageOptions = {
  sectionRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  backPlateRef: RefObject<HTMLDivElement | null>;
  ambientRef?: RefObject<HTMLElement | null>;
  enableParallax: boolean;
  enableMouse: boolean;
};

export function useHero3DStage({
  sectionRef,
  stageRef,
  panelRef,
  backPlateRef,
  ambientRef,
  enableParallax,
  enableMouse,
}: UseHero3DStageOptions) {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const panel = panelRef.current;
    const backPlate = backPlateRef.current;
    const ambient = ambientRef?.current ?? null;
    if (!section || !stage || !panel) return;

    const { mouse, scroll, ambient: ambientMotion } = HERO_PARALLAX;

    const onMove = (event: MouseEvent) => {
      if (!enableMouse || !backPlate) return;
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(panel, {
        rotateY: x * mouse.rotateY,
        rotateX: -mouse.rotateX * 0.75 + -y * mouse.rotateX,
        duration: 0.55,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(backPlate, {
        rotateY: x * -mouse.rotateY * 0.5,
        rotateX: mouse.rotateX + y * (mouse.rotateX * 0.6),
        duration: 0.65,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onLeave = () => {
      if (!enableMouse || !backPlate) return;
      gsap.to(panel, {
        rotateY: 0,
        rotateX: -mouse.rotateX * 0.75,
        duration: 0.75,
        ease: "power2.out",
      });
      gsap.to(backPlate, {
        rotateY: 0,
        rotateX: mouse.rotateX,
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
        gsap.set(backPlate, {
          z: -110,
          rotateX: mouse.rotateX,
          transformPerspective: 1200,
        });
      }
      if (enableParallax) {
        gsap.set(panel, {
          z: 48,
          rotateX: -mouse.rotateX * 0.75,
          transformPerspective: 1200,
        });

        gsap.fromTo(
          panel,
          { y: 0, z: 48, scale: 1 },
          {
            y: scroll.y,
            z: scroll.z,
            scale: scroll.scale,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: 0.75,
            },
          }
        );

        if (backPlate) {
          gsap.fromTo(
            backPlate,
            { y: 0, z: -110 },
            {
              y: 22,
              z: -150,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom top",
                scrub: 0.75,
              },
            }
          );
        }

        if (ambient) {
          gsap.fromTo(
            ambient,
            { yPercent: 0, scale: 1 },
            {
              yPercent: ambientMotion.yPercent,
              scale: ambientMotion.scale,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom top",
                scrub: 0.85,
              },
            }
          );
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
  }, [
    enableParallax,
    enableMouse,
    sectionRef,
    stageRef,
    panelRef,
    backPlateRef,
    ambientRef,
  ]);
}
