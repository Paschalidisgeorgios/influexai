"use client";

import { useCallback, useEffect, useRef } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingAgentAutopilotSection } from "@/components/landing/LandingAgentAutopilotSection";
import { LandingBentoShowcase } from "@/components/landing/LandingBentoShowcase";
import { LandingCampaignPackSection } from "@/components/landing/LandingCampaignPackSection";
import { LandingCtaV2 } from "@/components/landing/LandingCtaV2";
import { LandingNavV2 } from "@/components/landing/LandingNavV2";
import { LandingUseCasesSection } from "@/components/landing/LandingUseCasesSection";
import { LandingFooter, PricingSection } from "@/components/landing/Sections";
import { useMouseVelocity } from "@/hooks/useMouseVelocity";

const BEHAVIOR_COOLDOWN_MS = 4000;

export function LandingPageV2() {
  const heroRef = useRef<HTMLDivElement>(null);
  const loadTime = useRef(Date.now());
  const earlyScrollFired = useRef(false);
  const lastBehaviorAt = useRef(0);

  const pushBehavior = useCallback((text: string) => {
    const now = Date.now();
    if (now - lastBehaviorAt.current < BEHAVIOR_COOLDOWN_MS) return;
    lastBehaviorAt.current = now;
    if (typeof window !== "undefined" && window.__landingCapsuleShow) {
      window.__landingCapsuleShow(text, 5000);
    }
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let lastTs = performance.now();
    let fastSince: number | null = null;
    let lastFastTrigger = 0;

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = now - lastTs;
      if (dt < 16) return;

      const velocity = (Math.abs(y - lastY) / dt) * 1000;
      lastY = y;
      lastTs = now;

      if (
        !earlyScrollFired.current &&
        now - loadTime.current < 2000 &&
        y > 200
      ) {
        earlyScrollFired.current = true;
        pushBehavior(
          "Halt, geh wieder hoch! Das Intro-Video war verdammt teuer zu rendern! 🎬"
        );
      }

      if (velocity > 800) {
        if (fastSince === null) fastSince = now;
        if (now - fastSince >= 200 && now - lastFastTrigger >= 6000) {
          lastFastTrigger = now;
          fastSince = null;
          pushBehavior(
            "Hey, scroll nicht so schnell! Meine Quantenprozessoren kommen bei dem Tempo nicht mit! 🧠"
          );
        }
      } else {
        fastSince = null;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pushBehavior]);

  useMouseVelocity(heroRef, {
    thresholdPxPerFrame: 60,
    sustainMs: 800,
    cooldownMs: 8000,
    onWobble: useCallback(() => {
      pushBehavior(
        "Alles okay bei dir? Suchst du den Login oder testest du nur meine Framerate? ⏱️"
      );
    }, [pushBehavior]),
  });

  const handleBentoLongHover = useCallback(() => {
    pushBehavior(
      "Ich sehe dich... Keine Sorge, du darfst das Design anfassen (klicken). 👀"
    );
  }, [pushBehavior]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#08080a] text-white">
      <style jsx global>{`
        .landing-v2-pricing .pc-hot {
          box-shadow: 0 0 40px rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.12) !important;
          border-color: rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.28) !important;
        }
      `}</style>

      <LandingNavV2 />

      <main>
        <div ref={heroRef}>
          <HeroSection />
        </div>

        <LandingUseCasesSection />
        <LandingCampaignPackSection />
        <LandingBentoShowcase onBentoLongHover={handleBentoLongHover} />
        <LandingAgentAutopilotSection />

        <div id="pricing" className="landing-v2-pricing border-t border-white/[0.06]">
          <PricingSection />
        </div>

        <LandingCtaV2 />
      </main>

      <LandingFooter />
    </div>
  );
}

declare global {
  interface Window {
    __landingCapsuleShow?: (msg: string, duration?: number) => void;
  }
}
