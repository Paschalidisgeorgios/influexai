"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLandingViewport } from "./useLandingViewport";
import { useLandingV2Links } from "../LandingV2ModeContext";

import { syncLandingScrollY, resetLandingScrollY } from "@/lib/landing-v2-motion";

import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

/** Lenis smooth scroll — landing preview only */
export function useLandingLenis() {
  const { enableLenis: viewportLenis } = useLandingViewport();
  const { enableLenis: previewLenis } = useLandingV2Links();
  const enableLenis = viewportLenis && previewLenis;

  useEffect(() => {
    if (!enableLenis) return;

    const lenis = new Lenis({
      duration: 1.12,
      smoothWheel: true,
      lerp: 0.09,
      wheelMultiplier: 0.92,
    });

    const root = document.documentElement;

    ScrollTrigger.scrollerProxy(root, {
      scrollTop(value) {
        if (arguments.length && value !== undefined) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
      pinType: root.style.transform ? "transform" : "fixed",
    });

    lenis.on("scroll", ({ scroll }) => {
      syncLandingScrollY(scroll);
      ScrollTrigger.update();
    });

    const onTick = () => {
      lenis.raf(performance.now());
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const onRefresh = () => {
      lenis.resize();
    };

    const refresh = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };

    const refreshTimer = window.setTimeout(refresh, 220);
    window.addEventListener("resize", refresh);
    ScrollTrigger.addEventListener("refresh", onRefresh);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("resize", refresh);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      resetLandingScrollY();
      ScrollTrigger.scrollerProxy(root, {});
      ScrollTrigger.refresh();
    };
  }, [enableLenis]);
}
