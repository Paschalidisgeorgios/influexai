"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { LandingAgentAutopilotSection } from "@/components/landing/LandingAgentAutopilotSection";
import { LandingCampaignPackSection } from "@/components/landing/LandingCampaignPackSection";
import { LandingCtaV2 } from "@/components/landing/LandingCtaV2";
import SentientInterface2026 from "@/components/landing/SentientInterface2026";
import { LandingUseCasesSection } from "@/components/landing/LandingUseCasesSection";
import { LandingFooter, PricingSection } from "@/components/landing/Sections";

export function LandingPageV2() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#08080a] text-white">
      <style jsx global>{`
        .landing-v2-pricing .pc-hot {
          box-shadow: 0 0 40px rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.12) !important;
          border-color: rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.28) !important;
        }
      `}</style>

      <main>
        <HeroSection />

        <SentientInterface2026 />

        <LandingUseCasesSection />
        <LandingCampaignPackSection />
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
