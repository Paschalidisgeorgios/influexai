"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { HERO_PARALLAX, HERO_PARALLAX_PREVIEW } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

type UseHero3DStageOptions = {
  sectionRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  backPlateRef: RefObject<HTMLDivElement | null>;
  ambientRef?: RefObject<HTMLElement | null>;
  videoRef?: RefObject<HTMLVideoElement | null>;
  enableParallax: boolean;
  enableMouse: boolean;
  enhanced?: boolean;
};

export function useHero3DStage({
  sectionRef,
  stageRef,
  panelRef,
  backPlateRef,
  ambientRef,
  videoRef,
  enableParallax,
  enableMouse,
  enhanced = false,
}: UseHero3DStageOptions) {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const panel = panelRef.current;
    const backPlate = backPlateRef.current;
    const ambient = ambientRef?.current ?? null;
    const video = videoRef?.current ?? null;
    if (!section || !stage || !panel) return;

    const preset = enhanced ? HERO_PARALLAX_PREVIEW : HERO_PARALLAX;
    const { mouse, scroll } = preset;
    const ambientMotion = enhanced ? HERO_PARALLAX_PREVIEW.ambient : HERO_PARALLAX.ambient;
    const videoMotion = enhanced ? HERO_PARALLAX_PREVIEW.video : null;

    const onMove = (event: MouseEvent) => {
      if (!enableMouse || !backPlate) return;
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(panel, {
        rotateY: x * mouse.rotateY,
        rotateX: -mouse.rotateX * 0.5 + -y * mouse.rotateX * 0.5,
        x: x * 8,
        y: y * 4,
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
        rotateX: -mouse.rotateX * 0.35,
        x: 0,
        y: 0,
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
          z: scroll.z ?? 48,
          rotateX: -mouse.rotateX * 0.35,
          transformPerspective: 1200,
        });

        gsap.fromTo(
          panel,
          { y: 0, z: scroll.z ?? 48, scale: 1 },
          {
            y: scroll.y,
            z: (scroll.z ?? 48) - 12,
            scale: scroll.scale,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: enhanced ? 0.65 : 0.75,
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
                scrub: enhanced ? 0.65 : 0.75,
              },
            }
          );
        }

        if (video && videoMotion) {
          gsap.fromTo(
            video,
            { scale: videoMotion.scaleFrom, yPercent: -videoMotion.yPercent * 0.35 },
            {
              scale: videoMotion.scaleTo,
              yPercent: videoMotion.yPercent,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom top",
                scrub: 0.7,
              },
            }
          );
        } else if (ambient) {
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
    enhanced,
    sectionRef,
    stageRef,
    panelRef,
    backPlateRef,
    ambientRef,
    videoRef,
  ]);
}
