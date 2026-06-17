"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SOCIAL_PROOF_COUNTER } from "@/lib/landing-v2-motion";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Counter-up for neutral system stats only */
export function useSocialProofCounter(
  sectionRef: RefObject<HTMLElement | null>,
  enabled = true
) {
  const reduceMotion = useReducedMotion();
  const { enablePreviewMotion } = useLandingV2Links();
  const motionOn = enabled && enablePreviewMotion && !reduceMotion;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !motionOn) return;

    const counters = section.querySelectorAll<HTMLElement>("[data-proof-value]");
    if (!counters.length) return;

    const ctx = gsap.context(() => {
      counters.forEach((el) => {
        const target = Number(el.dataset.proofValue ?? "0");
        if (!Number.isFinite(target)) return;

        const state = { value: 0 };

        gsap.to(state, {
          value: target,
          duration: SOCIAL_PROOF_COUNTER.duration,
          ease: SOCIAL_PROOF_COUNTER.ease,
          scrollTrigger: {
            trigger: el,
            start: SOCIAL_PROOF_COUNTER.start,
            once: true,
          },
          onUpdate: () => {
            el.textContent = String(Math.round(state.value));
          },
          onComplete: () => {
            el.textContent = String(target);
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, [sectionRef, motionOn]);
}
