import {
  LandingNav,
  HeroSection,
  TickerStrip,
  ForBrandsSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  FaqSection,
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
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
