"use client";

import "@/styles/landing-neon.css";
import "@/styles/landing-glass.css";

import { HeroSection } from "@/components/landing/HeroSection";
import { LandingAgentAutopilotSection } from "@/components/landing/LandingAgentAutopilotSection";
import { LandingCampaignPackSection } from "@/components/landing/LandingCampaignPackSection";
import { LandingCtaV2 } from "@/components/landing/LandingCtaV2";
import { LandingNavV2 } from "@/components/landing/LandingNavV2";
import SentientInterface2026 from "@/components/landing/SentientInterface2026";
import { LandingMediaSection } from "@/components/landing/LandingMediaSection";
import { LandingUseCasesSection } from "@/components/landing/LandingUseCasesSection";
import { LandingFooter, PricingSection } from "@/components/landing/Sections";

export function LandingPageV2() {
  return (
    <div className="landing-neon landing-root relative min-h-screen overflow-x-clip bg-[#030304]">
      <LandingNavV2 />

      <main className="relative z-10">
        <HeroSection />

        <SentientInterface2026 />

        <LandingUseCasesSection />
        <LandingMediaSection />
        <LandingCampaignPackSection />
        <LandingAgentAutopilotSection />

        <div id="pricing" className="landing-v2-pricing border-t border-[color:var(--border-soft)]">
          <PricingSection />
        </div>

        <LandingCtaV2 />
      </main>

      <LandingFooter />
    </div>
  );
}
