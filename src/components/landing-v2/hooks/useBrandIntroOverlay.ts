"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import {
  BRAND_INTRO_AUTO_DELAY_MS,
  BRAND_INTRO_HERO_READY_AT_S,
} from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

type BrandIntroOverlayRefs = {
  overlay: RefObject<HTMLDivElement | null>;
  logo: RefObject<HTMLElement | null>;
  mask: RefObject<HTMLElement | null>;
  signals: RefObject<HTMLElement | null>;
  fragments: RefObject<HTMLElement | null>;
};

type UseBrandIntroOverlayOptions = {
  enabled: boolean;
  isMobile: boolean;
  onHeroReady: () => void;
  onDismiss: () => void;
};

export function useBrandIntroOverlay(
  refs: BrandIntroOverlayRefs,
  { enabled, isMobile, onHeroReady, onDismiss }: UseBrandIntroOverlayOptions
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled) return;

    const overlayEl = refs.overlay.current;
    if (!overlayEl) return;

    let started = false;
    let finished = false;
    let autoTimer = 0;
    let ctx: gsap.Context | undefined;
    let timeline: gsap.core.Timeline | null = null;

    const unlockScroll = () => {
      document.body.style.overflow = "";
    };

    const lockScroll = () => {
      document.body.style.overflow = "hidden";
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      unlockScroll();
      onDismiss();
    };

    const heroReadyOnce = (() => {
      let fired = false;
      return () => {
        if (fired) return;
        fired = true;
        onHeroReady();
      };
    })();

    const cleanupListeners: Array<() => void> = [];

    const addListener = (
      target: Window,
      type: string,
      handler: EventListener,
      options?: AddEventListenerOptions
    ) => {
      target.addEventListener(type, handler, options);
      cleanupListeners.push(() => target.removeEventListener(type, handler, options));
    };

    if (reduceMotion) {
      heroReadyOnce();
      autoTimer = window.setTimeout(finish, BRAND_INTRO_AUTO_DELAY_MS.reduced);
      return () => {
        window.clearTimeout(autoTimer);
        unlockScroll();
      };
    }

    lockScroll();

    const playIntro = () => {
      if (started || finished) return;
      started = true;
      window.clearTimeout(autoTimer);

      const dissolveStart = isMobile ? 0.36 : 0.46;
      const heroAt = isMobile
        ? BRAND_INTRO_HERO_READY_AT_S.mobile
        : BRAND_INTRO_HERO_READY_AT_S.desktop;

      ctx = gsap.context(() => {
        const logoEl = refs.logo.current;
        const maskEl = refs.mask.current;
        const signalLines = refs.signals.current?.querySelectorAll("[data-brand-signal]");
        const fragmentLines = refs.fragments.current?.querySelectorAll("[data-brand-fragment]");

        timeline = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          onComplete: finish,
        });

        if (logoEl) {
          gsap.set(logoEl, { opacity: 0, scale: 0.98, filter: "blur(0px) brightness(1)" });
          timeline.to(logoEl, { opacity: 1, scale: 1, duration: 0.38, ease: "power2.out" }, 0);
          timeline.to(
            logoEl,
            {
              opacity: 0,
              scale: isMobile ? 1.08 : 1.14,
              filter: "blur(5px) brightness(1.14)",
              duration: 0.52,
            },
            dissolveStart
          );
        }

        timeline.add(heroReadyOnce, heroAt);

        if (signalLines?.length) {
          gsap.set(signalLines, { scaleX: 0.05, opacity: 0, transformOrigin: "center center" });
          timeline.to(
            signalLines,
            { scaleX: 1, opacity: 0.72, duration: 0.26, stagger: 0.04, ease: "power2.out" },
            dissolveStart
          );
          timeline.to(signalLines, { opacity: 0, duration: 0.2 }, dissolveStart + 0.32);
        }

        if (maskEl) {
          gsap.set(maskEl, {
            clipPath: "inset(38% 34% 38% 34% round 14px)",
            opacity: 1,
          });
          timeline.to(
            maskEl,
            {
              clipPath: "inset(0% 0% 0% 0% round 0px)",
              opacity: 0,
              duration: 0.58,
            },
            dissolveStart
          );
        }

        if (fragmentLines?.length) {
          gsap.set(fragmentLines, { scaleX: 0, opacity: 0, transformOrigin: "center center" });
          timeline.to(
            fragmentLines,
            { scaleX: 1.15, opacity: 0.55, duration: 0.28, stagger: 0.03, ease: "power2.out" },
            dissolveStart + 0.06
          );
          timeline.to(fragmentLines, { opacity: 0, duration: 0.18 }, dissolveStart + 0.38);
        }

        timeline.to(
          overlayEl,
          { autoAlpha: 0, duration: 0.36, ease: "power2.out" },
          dissolveStart + 0.38
        );
      }, overlayEl);
    };

    const onInteract = () => {
      playIntro();
    };

    const autoDelay = isMobile
      ? BRAND_INTRO_AUTO_DELAY_MS.mobile
      : BRAND_INTRO_AUTO_DELAY_MS.desktop;

    autoTimer = window.setTimeout(playIntro, autoDelay);

    addListener(window, "wheel", onInteract, { passive: true });
    addListener(window, "touchstart", onInteract, { passive: true });
    addListener(window, "keydown", onInteract);

    return () => {
      window.clearTimeout(autoTimer);
      cleanupListeners.forEach((fn) => fn());
      timeline?.kill();
      ctx?.revert();
      unlockScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isMobile, onHeroReady, onDismiss, reduceMotion]);
}
