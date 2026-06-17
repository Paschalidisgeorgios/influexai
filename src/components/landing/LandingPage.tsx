"use client";

import dynamic from "next/dynamic";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./landing-terminal.css";
import { SmoothScroll } from "./SmoothScroll";
import { HeroSection } from "./HeroSection";
import { NumbersSection } from "./NumbersSection";
import { ProductStorySection } from "./ProductStorySection";
import { TerminalPricingSection } from "./TerminalPricingSection";
import { TerminalCtaSection } from "./TerminalCtaSection";
import { TerminalFooter } from "./TerminalFooter";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
});

const ParticleField = dynamic(
  () => import("./ParticleField").then((mod) => mod.ParticleField),
  { ssr: false }
);

export function LandingPage() {
  return (
    <div className={`${plusJakarta.className} relative min-h-screen overflow-x-clip bg-[#09090b] text-white`}>
      <SmoothScroll>
        <ParticleField />
        <main className="relative z-10">
          <HeroSection />
          <NumbersSection />
          <ProductStorySection />
          <TerminalPricingSection />
          <TerminalCtaSection />
        </main>
        <TerminalFooter />
      </SmoothScroll>
    </div>
  );
}
