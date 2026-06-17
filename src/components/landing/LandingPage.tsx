"use client";

import dynamic from "next/dynamic";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./landing-terminal.css";
import SmoothScroll from "./SmoothScroll";
import HomeLandingNav from "./HomeLandingNav";
import HeroSection from "./HeroSection";
import NumbersSection from "./NumbersSection";
import ProductStory from "./ProductStory";
import PricingSection from "./PricingSection";
import CtaSection from "./CtaSection";
import LandingFooter from "./LandingFooter";

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
    <div
      className={`${plusJakarta.className} relative min-h-screen overflow-x-clip text-white`}
      style={
        {
          "--bg": "#09090b",
          "--surface": "#0f0f12",
          "--border": "rgba(255,255,255,0.06)",
          "--text": "#ffffff",
          "--text-2": "rgba(255,255,255,0.45)",
          "--text-3": "rgba(255,255,255,0.2)",
          "--accent": "#b4ff00",
          "--accent-bg": "rgba(180,255,0,0.06)",
          background: "#09090b",
        } as React.CSSProperties
      }
    >
      <SmoothScroll>
        <ParticleField />
        <main className="relative z-[1]" style={{ minHeight: "100vh" }}>
          <HomeLandingNav />
          <HeroSection />
          <NumbersSection />
          <ProductStory />
          <PricingSection />
          <CtaSection />
          <LandingFooter />
        </main>
      </SmoothScroll>
    </div>
  );
}
