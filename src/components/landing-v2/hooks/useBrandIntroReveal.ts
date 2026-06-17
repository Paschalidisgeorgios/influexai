"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BRAND_INTRO_SCROLL_VH } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

type BrandIntroRefs = {
  section: RefObject<HTMLElement | null>;
  logo: RefObject<HTMLElement | null>;
  mask: RefObject<HTMLElement | null>;
  signals: RefObject<HTMLElement | null>;
  fragments: RefObject<HTMLElement | null>;
  hint: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLElement | null>;
};

type UseBrandIntroRevealOptions = {
  enabled: boolean;
  isMobile: boolean;
  onRevealReady: () => void;
};

export function useBrandIntroReveal(
  refs: BrandIntroRefs,
  { enabled, isMobile, onRevealReady }: UseBrandIntroRevealOptions
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled) return;

    const sectionEl = refs.section.current;
    if (!sectionEl) return;

    let readyFired = false;
    const fireReady = () => {
      if (readyFired) return;
      readyFired = true;
      onRevealReady();
    };

    if (reduceMotion) {
      const timer = window.setTimeout(fireReady, 320);
      return () => window.clearTimeout(timer);
    }

    if (isMobile) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          onComplete: fireReady,
        });

        if (refs.logo.current) {
          gsap.set(refs.logo.current, { opacity: 0, scale: 0.98 });
          tl.to(refs.logo.current, { opacity: 1, scale: 1, duration: 0.45 }, 0.1);
          tl.to(
            refs.logo.current,
            { opacity: 0, scale: 1.04, duration: 0.5, ease: "power2.inOut" },
            0.85
          );
        }

        if (refs.signals.current) {
          const lines = refs.signals.current.querySelectorAll("[data-brand-signal]");
          gsap.set(lines, { scaleX: 0, opacity: 0 });
          tl.to(lines, { scaleX: 1, opacity: 0.7, duration: 0.35, stagger: 0.06 }, 0.35);
          tl.to(lines, { opacity: 0, duration: 0.3 }, 0.9);
        }

        if (refs.stage.current) {
          tl.to(refs.stage.current, { opacity: 0, duration: 0.35 }, 1.05);
        }
      }, sectionEl);

      return () => ctx.revert();
    }

    let trigger: ScrollTrigger | undefined;
    const onFirstWheel = () => {
      if (window.scrollY < 8) {
        window.scrollTo({ top: Math.min(sectionEl.offsetHeight * 0.35, 280), behavior: "smooth" });
      }
    };

    const ctx = gsap.context(() => {
      const logoEl = refs.logo.current;
      const maskEl = refs.mask.current;
      const signalsEl = refs.signals.current;
      const fragmentsEl = refs.fragments.current;
      const hintEl = refs.hint.current;
      const stageEl = refs.stage.current;
      const signalLines = signalsEl?.querySelectorAll("[data-brand-signal]");
      const fragmentLines = fragmentsEl?.querySelectorAll("[data-brand-fragment]");

      if (logoEl) gsap.set(logoEl, { opacity: 1, scale: 1 });
      if (maskEl) {
        gsap.set(maskEl, {
          clipPath: "inset(42% 38% 42% 38% round 12px)",
          opacity: 1,
        });
      }
      if (signalLines?.length) {
        gsap.set(signalLines, { scaleX: 0.08, opacity: 0, transformOrigin: "center center" });
      }
      if (fragmentLines?.length) {
        gsap.set(fragmentLines, { scaleX: 0, opacity: 0, transformOrigin: "center center" });
      }
      if (hintEl) gsap.set(hintEl, { opacity: 0.55, y: 0 });

      trigger = ScrollTrigger.create({
        trigger: sectionEl,
        start: "top top",
        end: `+=${BRAND_INTRO_SCROLL_VH}vh`,
        scrub: 0.45,
        onUpdate: (self) => {
          const p = self.progress;

          if (logoEl) {
            gsap.set(logoEl, {
              opacity: Math.max(0, 1 - p * 1.15),
              scale: 1 + p * 0.18,
              filter: `blur(${p * 6}px)`,
            });
          }

          if (maskEl) {
            const insetY = 42 - p * 42;
            const insetX = 38 - p * 38;
            gsap.set(maskEl, {
              clipPath: `inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${12 - p * 12}px)`,
              opacity: 1 - p * 0.92,
            });
          }

          if (signalLines?.length) {
            gsap.set(signalLines, {
              scaleX: 0.08 + p * 1.4,
              opacity: Math.min(0.85, p * 1.1) * (1 - Math.max(0, p - 0.72) * 3),
            });
          }

          if (fragmentLines?.length) {
            gsap.set(fragmentLines, {
              scaleX: Math.max(0, (p - 0.25) * 1.6),
              opacity: Math.max(0, (p - 0.3) * 1.4) * (1 - Math.max(0, p - 0.8) * 4),
            });
          }

          if (hintEl) {
            gsap.set(hintEl, { opacity: Math.max(0, 0.55 - p * 1.4), y: p * 10 });
          }

          if (stageEl && p > 0.88) {
            gsap.set(stageEl, { opacity: Math.max(0, 1 - (p - 0.88) * 8) });
          }

          if (p > 0.58) fireReady();
        },
        onLeave: fireReady,
      });
    }, sectionEl);

    window.addEventListener("wheel", onFirstWheel, { once: true, passive: true });

    return () => {
      window.removeEventListener("wheel", onFirstWheel);
      trigger?.kill();
      ctx.revert();
    };
    // refs are stable useRef handles — omit object identity from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isMobile, onRevealReady, reduceMotion]);
}
