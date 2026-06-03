import {
  LandingNav,
  HeroSection,
  TickerStrip,
  ForBrandsSection,
  FeaturesSection,
  PricingSection,
  CtaSection,
  LandingFooter,
} from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <TickerStrip />
        <ForBrandsSection />
        <FeaturesSection />
        <PricingSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
