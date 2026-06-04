import {
  LandingNav,
  HeroSection,
  TickerStrip,
  ForBrandsSection,
  HowItWorksSection,
  FeaturesSection,
  TestimonialsSection,
  PricingSection,
  FaqSection,
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
        <HowItWorksSection />
        <ForBrandsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
