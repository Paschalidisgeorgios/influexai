"use client";

import "@/styles/landing-glass.css";
import "@/styles/pricing-glass.css";

import { HeroSection } from "@/components/landing/HeroSection";
import { LandingAgentAutopilotSection } from "@/components/landing/LandingAgentAutopilotSection";
import { LandingCampaignPackSection } from "@/components/landing/LandingCampaignPackSection";
import { LandingNavV2 } from "@/components/landing/LandingNavV2";
import SentientInterface2026 from "@/components/landing/SentientInterface2026";
import { LandingMediaSection } from "@/components/landing/LandingMediaSection";
import { LandingUseCasesSection } from "@/components/landing/LandingUseCasesSection";
import { LandingSectionGlowBackground } from "@/components/landing/LandingSectionGlowBackground";
import { LandingFooter, PricingSection } from "@/components/landing/Sections";
import { useSectionGlow } from "@/hooks/useSectionGlow";

export function LandingPageV2() {
  const { activeSection } = useSectionGlow();

  return (
    <div className="landing-neon landing-root relative min-h-screen overflow-x-clip bg-[#050505]">
      <LandingSectionGlowBackground activeSection={activeSection} />
      <LandingNavV2 />

      <main className="relative z-10">
        <HeroSection />

        <SentientInterface2026 />

        <LandingUseCasesSection />
        <LandingMediaSection />
        <LandingCampaignPackSection />
        <LandingAgentAutopilotSection />

        <div
          id="pricing"
          data-landing-glow="pricing"
          className="pricing-glass-section landing-v2-pricing relative overflow-x-clip overflow-y-visible px-6 py-20 md:px-12"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="landing-glass-dot-grid absolute inset-0 opacity-60" />
            <div className="pricing-glass-glow pricing-glass-glow--violet" />
            <div className="pricing-glass-glow pricing-glass-glow--cyan-green" />
            <div className="pricing-glass-vignette" />
          </div>
          <div className="relative z-10">
            <PricingSection />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
