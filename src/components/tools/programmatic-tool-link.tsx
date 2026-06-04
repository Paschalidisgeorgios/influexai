import Link from "next/link";
import {
  FEATURES,
  NICHES,
  resolveNicheSlug,
  toolPagePath,
  type FeatureKey,
} from "@/lib/programmatic-seo";

type Props = {
  feature: FeatureKey;
  nicheText: string;
  className?: string;
};

export function ProgrammaticToolLink({
  feature,
  nicheText,
  className = "",
}: Props) {
  const slug = resolveNicheSlug(nicheText);
  if (!slug) return null;

  const f = FEATURES[feature];
  const n = NICHES[slug];

  return (
    <Link
      href={toolPagePath(feature, slug)}
      className={
        className ||
        "mt-3 inline-flex text-sm text-[#B4FF00] hover:underline"
      }
    >
      Mehr über {n.nameDe} Creator Tools → {f.nameDe}
    </Link>
  );
}
