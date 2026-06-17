"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import {
  BRAND_INTRO_AUTO_DELAY_MS,
  BRAND_INTRO_HERO_DISSOLVE_PROGRESS,
  BRAND_INTRO_MIN_VISIBLE_MS,
  BRAND_INTRO_PHASES,
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
  onChromeVisible: () => void;
};

export function useBrandIntroOverlay(
  refs: BrandIntroOverlayRefs,
  { enabled, isMobile, onHeroReady, onDismiss, onChromeVisible }: UseBrandIntroOverlayOptions
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled) return;

    const overlayEl = refs.overlay.current;
    if (!overlayEl) return;

    let started = false;
    let finished = false;
    let autoTimer = 0;
    let playStartTime = 0;
    let ctx: gsap.Context | undefined;
    let timeline: gsap.core.Timeline | null = null;
    let progressTween: gsap.core.Tween | null = null;

    const unlockScroll = () => {
      document.body.style.overflow = "";
    };

    const lockScroll = () => {
      document.body.style.overflow = "hidden";
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      progressTween?.kill();
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

    const chromeVisibleOnce = (() => {
      let fired = false;
      return () => {
        if (fired) return;
        fired = true;
        onChromeVisible();
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
      chromeVisibleOnce();
      autoTimer = window.setTimeout(finish, BRAND_INTRO_AUTO_DELAY_MS.reduced + 280);
      return () => {
        window.clearTimeout(autoTimer);
        unlockScroll();
      };
    }

    lockScroll();

    const playIntro = () => {
      if (started || finished) return;
      started = true;
      playStartTime = Date.now();
      window.clearTimeout(autoTimer);

      const phases = isMobile ? BRAND_INTRO_PHASES.mobile : BRAND_INTRO_PHASES.desktop;

      const fadeEnd = phases.fadeIn;
      const holdEnd = fadeEnd + phases.hold;
      const breathEnd = holdEnd + phases.breath;
      const signalStart = breathEnd - phases.breath * 0.25;
      const signalEnd = signalStart + phases.signal;
      const dissolveStart = signalEnd - phases.signal * 0.35;
      const dissolveEnd = dissolveStart + phases.dissolve;
      const overlayStart = dissolveStart + phases.dissolve * 0.35;
      const heroAt = dissolveStart + phases.dissolve * BRAND_INTRO_HERO_DISSOLVE_PROGRESS;

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
          gsap.set(logoEl, { opacity: 0, scale: 0.99, filter: "blur(0px) brightness(1)" });
          timeline.to(
            logoEl,
            { opacity: 1, scale: 1, duration: phases.fadeIn, ease: "power3.out" },
            0
          );
          timeline.to(
            logoEl,
            { scale: 1.025, duration: phases.breath, ease: "sine.inOut" },
            holdEnd
          );
          timeline.to(
            logoEl,
            {
              scale: isMobile ? 1.06 : 1.08,
              duration: phases.dissolve * 0.55,
              ease: "power2.inOut",
            },
            dissolveStart
          );
          timeline.to(
            logoEl,
            {
              opacity: 0,
              scale: isMobile ? 1.08 : 1.12,
              filter: "blur(8px) brightness(1.06)",
              duration: phases.dissolve * 0.45,
              ease: "power3.inOut",
            },
            dissolveStart + phases.dissolve * 0.42
          );
        }

        timeline.add(heroReadyOnce, heroAt);
        timeline.add(chromeVisibleOnce, overlayStart);

        if (signalLines?.length) {
          const signalOpacity = isMobile ? 0.32 : 0.48;
          gsap.set(signalLines, { scaleX: 0.04, opacity: 0, transformOrigin: "center center" });
          timeline.to(
            signalLines,
            {
              scaleX: 1,
              opacity: signalOpacity,
              duration: phases.signal * 0.55,
              stagger: 0.08,
              ease: "power2.inOut",
            },
            signalStart
          );
          timeline.to(
            signalLines,
            { opacity: 0, duration: phases.signal * 0.4, ease: "power2.inOut" },
            signalStart + phases.signal * 0.5
          );
        }

        if (!isMobile && fragmentLines?.length) {
          gsap.set(fragmentLines, { scaleX: 0, opacity: 0, transformOrigin: "center center" });
          timeline.to(
            fragmentLines,
            {
              scaleX: 1.08,
              opacity: 0.38,
              duration: phases.signal * 0.5,
              stagger: 0.06,
              ease: "power2.inOut",
            },
            signalStart + 0.12
          );
          timeline.to(
            fragmentLines,
            { opacity: 0, duration: phases.signal * 0.35, ease: "power2.inOut" },
            signalStart + phases.signal * 0.55
          );
        }

        if (maskEl) {
          gsap.set(maskEl, {
            clipPath: "inset(40% 36% 40% 36% round 16px)",
            opacity: 0.85,
          });
          timeline.to(
            maskEl,
            {
              clipPath: "inset(0% 0% 0% 0% round 0px)",
              opacity: 0,
              duration: phases.overlayFade,
              ease: "power3.inOut",
            },
            overlayStart
          );
        }

        timeline.to(
          overlayEl,
          { autoAlpha: 0, duration: phases.overlayFade, ease: "power3.inOut" },
          overlayStart
        );
      }, overlayEl);
    };

    const accelerateIntro = () => {
      if (!timeline || finished) return;

      const elapsed = Date.now() - playStartTime;
      if (elapsed < BRAND_INTRO_MIN_VISIBLE_MS) {
        timeline.timeScale(Math.min(timeline.timeScale() + 0.22, 1.75));
        return;
      }

      const current = timeline.progress();
      if (current >= 0.92) return;

      progressTween?.kill();
      progressTween = gsap.to(timeline, {
        progress: Math.min(current + 0.14, 1),
        duration: 0.55,
        ease: "power2.inOut",
        onComplete: () => {
          if (timeline && timeline.progress() >= 0.99) finish();
        },
      });
    };

    const onInteract = () => {
      if (!started) {
        playIntro();
        return;
      }
      accelerateIntro();
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
      progressTween?.kill();
      timeline?.kill();
      ctx?.revert();
      unlockScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isMobile, onHeroReady, onDismiss, onChromeVisible, reduceMotion]);
}
