"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MEDIA_STAGE_SCROLL, type MediaStageBlend } from "@/lib/landing-v2-motion";
import {
  MEDIA_STAGE_SECTIONS,
  type MediaStageState,
} from "@/lib/landing-v2-media-stage";

gsap.registerPlugin(ScrollTrigger);

type LayerRefs = Record<MediaStageState, HTMLElement | null>;

type UseMediaStageScrollOptions = {
  stageRef: RefObject<HTMLElement | null>;
  scrimRef: RefObject<HTMLElement | null>;
  primaryVideoRef: RefObject<HTMLVideoElement | null>;
  secondaryVideoRef: RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
};

function queryLayers(stage: HTMLElement): LayerRefs {
  return {
    hero: stage.querySelector('[data-media-layer="hero"]'),
    system: stage.querySelector('[data-media-layer="system"]'),
    workflow: stage.querySelector('[data-media-layer="workflow"]'),
    studio: stage.querySelector('[data-media-layer="studio"]'),
    outputs: stage.querySelector('[data-media-layer="outputs"]'),
  };
}

function applyBlend(
  layers: LayerRefs,
  scrim: HTMLElement | null,
  blend: MediaStageBlend,
  primaryVideo: HTMLVideoElement | null,
  secondaryVideo: HTMLVideoElement | null
) {
  (Object.keys(layers) as MediaStageState[]).forEach((key) => {
    const layer = layers[key];
    if (layer) gsap.set(layer, { opacity: blend.layers[key] ?? 0 });
  });

  if (scrim) {
    gsap.set(scrim, { opacity: blend.scrim });
  }

  if (primaryVideo) {
    gsap.set(primaryVideo, {
      scale: blend.primaryScale,
      yPercent: blend.primaryY,
    });
  }

  if (secondaryVideo) {
    gsap.set(secondaryVideo, {
      scale: blend.secondaryScale,
      yPercent: blend.secondaryY,
    });
  }
}

/** Scroll-driven cinematic media — crossfade states, no pin */
export function useMediaStageScroll({
  stageRef,
  scrimRef,
  primaryVideoRef,
  secondaryVideoRef,
  enabled = true,
}: UseMediaStageScrollOptions) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !enabled) return;

    const scrim = scrimRef.current;
    const primaryVideo = primaryVideoRef.current;
    const secondaryVideo = secondaryVideoRef.current;
    const layers = queryLayers(stage);
    const heroSection = document.querySelector(".landing-v2-hero");
    const main = document.querySelector(".landing-v2-main");

    if (!heroSection || !main) return;

    const sectionEls = MEDIA_STAGE_SECTIONS.map((item) => ({
      state: item.state,
      el: document.querySelector(item.selector),
    })).filter((item): item is { state: MediaStageState; el: Element } => !!item.el);

    const ctx = gsap.context(() => {
      applyBlend(
        layers,
        scrim,
        MEDIA_STAGE_SCROLL.blends.hero,
        primaryVideo,
        secondaryVideo
      );

      ScrollTrigger.create({
        trigger: heroSection,
        start: "top top",
        end: "bottom top",
        scrub: MEDIA_STAGE_SCROLL.heroScrub,
        onUpdate: (self) => {
          const p = self.progress;
          const hook = MEDIA_STAGE_SCROLL.heroHook;
          applyBlend(
            layers,
            scrim,
            {
              layers: {
                hero: hook.heroOpacity - p * hook.heroFade,
                system: p * hook.systemRise,
                workflow: 0,
                studio: 0,
                outputs: 0,
              },
              scrim: hook.scrimStart + p * hook.scrimDelta,
              primaryScale: hook.scaleStart - p * hook.scaleDelta,
              primaryY: p * hook.yDelta,
              secondaryScale: 1.06,
              secondaryY: 0,
            },
            primaryVideo,
            secondaryVideo
          );
        },
      });

      sectionEls.forEach(({ state, el }) => {
        const blend = MEDIA_STAGE_SCROLL.blends[state];
        if (!blend) return;

        ScrollTrigger.create({
          trigger: el,
          start: "top 72%",
          end: "bottom 28%",
          onEnter: () =>
            applyBlend(layers, scrim, blend, primaryVideo, secondaryVideo),
          onEnterBack: () =>
            applyBlend(layers, scrim, blend, primaryVideo, secondaryVideo),
        });
      });

      ScrollTrigger.create({
        trigger: main,
        start: "bottom bottom",
        end: "max",
        onEnter: () => {
          gsap.to(stage, {
            opacity: 0,
            duration: 0.85,
            ease: "power2.out",
          });
        },
        onLeaveBack: () => {
          gsap.to(stage, { opacity: 1, duration: 0.65, ease: "power2.out" });
        },
      });
    }, stage);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);
    const timer = window.setTimeout(refresh, 280);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", refresh);
      ctx.revert();
    };
  }, [enabled, stageRef, scrimRef, primaryVideoRef, secondaryVideoRef]);
}
