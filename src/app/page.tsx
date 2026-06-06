import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import {
  buildHreflangAlternates,
  getHomeSeo,
  localizedUrl,
  openGraphImageUrl,
  OPEN_GRAPH_LOCALE,
  parseKeywords,
} from "@/lib/seo";
import type { Locale } from "@/lib/locale";
import {
  HeroSection,
  TickerStrip,
  ForBrandsSection,
  HowItWorksSection,
  FeaturesSection,
  AgencyTeaserSection,
  FoundingCreatorsSection,
  PricingSection,
  FaqSection,
  CtaSection,
  LandingFooter,
} from "@/components/landing";
import { SiteHeader } from "@/components/SiteHeader";
import { LightSystem } from "@/components/LightSystem";
import ToolDemosSection from "@/components/demos/ToolDemosSection";
import { ABTracker } from "@/components/ab-tracker";
import { LiveStatsBar } from "@/components/live-stats-bar";
import { CommunityPreview } from "@/components/community-preview";
import type { AbVariant } from "@/lib/ab-tracking";

export const dynamic = "force-dynamic";

/** Marketing homepage only — White Label lives at /dashboard/white-label */

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const config = getHomeSeo(locale);
  const canonical = localizedUrl("/", locale);
  const ogImage = openGraphImageUrl(locale);

  return {
    title: config.title,
    description: config.description,
    keywords: parseKeywords(config.keywords),
    alternates: {
      ...buildHreflangAlternates("/"),
      canonical,
    },
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALE[locale],
      url: canonical,
      siteName: "InfluexAI",
      title: config.title,
      description: config.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("ab_variant")?.value;
  const variant: AbVariant = raw === "b" ? "b" : "a";

  return (
    <>
      <ABTracker variant={variant} />
      <LightSystem>
        <SiteHeader />
        <main className="landing-root">
          <HeroSection variant={variant} />
          <LiveStatsBar />
          <TickerStrip />
          <HowItWorksSection />
          <ToolDemosSection />
          <ForBrandsSection />
          <FoundingCreatorsSection />
          <CommunityPreview />
          <FeaturesSection />
          <AgencyTeaserSection />
          <PricingSection />
          <FaqSection />
          <CtaSection />
        </main>
        <LandingFooter />
      </LightSystem>
    </>
  );
}
