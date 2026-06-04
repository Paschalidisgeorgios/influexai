import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolNicheLanding } from "@/components/tools/tool-niche-landing";
import {
  FEATURES,
  NICHES,
  generatePageMetadata,
  getAllProgrammaticPaths,
  isFeatureKey,
  isNicheKey,
  type FeatureKey,
  type NicheKey,
} from "@/lib/programmatic-seo";
import { SEO_BASE_URL } from "@/lib/seo";

type Props = {
  params: Promise<{ feature: string; niche: string }>;
};

export async function generateStaticParams() {
  return getAllProgrammaticPaths().map(({ feature, niche }) => ({
    feature,
    niche,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { feature, niche } = await params;
  const meta = generatePageMetadata(feature, niche);
  if (!meta) return {};

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SEO_BASE_URL}/tools/${feature}/${niche}`,
      type: "website",
    },
  };
}

export default async function ToolNichePage({ params }: Props) {
  const { feature: featureParam, niche: nicheParam } = await params;

  if (!isFeatureKey(featureParam) || !isNicheKey(nicheParam)) {
    notFound();
  }

  const feature = featureParam as FeatureKey;
  const niche = nicheParam as NicheKey;

  if (!FEATURES[feature] || !NICHES[niche]) notFound();

  return <ToolNicheLanding feature={feature} niche={niche} />;
}
