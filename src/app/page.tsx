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
  TrustBarSection,
  PricingSection,
  FaqSection,
  LandingFooter,
  LandingNav,
} from "@/components/landing";
import { LandingBentoToolsSection } from "@/components/landing/LandingBentoToolsSection";
import { LandingUseCasesSection } from "@/components/landing/LandingUseCasesSection";
import { LandingValueSection } from "@/components/landing/LandingValueSection";
import { LandingAgentAutopilotSection } from "@/components/landing/LandingAgentAutopilotSection";
import { LightSystem } from "@/components/LightSystem";
import { ABTracker } from "@/components/ab-tracker";
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
        <LandingNav />
        <main className="landing-root overflow-x-clip max-w-[100vw]">
          <HeroSection variant={variant} />
          <LandingUseCasesSection />
          <LandingBentoToolsSection />
          <LandingValueSection />
          <TrustBarSection />
          <LandingAgentAutopilotSection />
          <PricingSection />
          <FaqSection />
        </main>
        <LandingFooter />
      </LightSystem>
    </>
  );
}
