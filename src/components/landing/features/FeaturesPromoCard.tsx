"use client";

import Link from "next/link";
import type { FeaturePromoVariant } from "@/lib/landing-features-menu";
import { useFeaturesMenuLabel } from "@/lib/features-menu-i18n";

const PROMO_GRADIENT: Record<FeaturePromoVariant, string> = {
  campaign:
    "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(204,255,0,0.18), transparent 55%), linear-gradient(180deg, rgba(24,24,27,0.95) 0%, rgba(9,9,11,0.98) 100%)",
  create:
    "linear-gradient(145deg, rgba(204,255,0,0.12), transparent 50%), linear-gradient(180deg, rgba(24,24,27,0.95) 0%, rgba(9,9,11,0.98) 100%)",
  visuals:
    "radial-gradient(circle at 30% 25%, rgba(204,255,0,0.16), transparent 45%), linear-gradient(160deg, rgba(39,39,42,0.9) 0%, rgba(9,9,11,0.98) 100%)",
  video:
    "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px), linear-gradient(135deg, rgba(24,24,32,0.95) 0%, rgba(9,9,11,0.98) 100%)",
  avatar:
    "linear-gradient(135deg, rgba(24,24,28,0.95) 0%, rgba(42,42,50,0.9) 50%, rgba(204,255,0,0.1) 100%)",
  intelligence:
    "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(204,255,0,0.14), transparent 60%), linear-gradient(180deg, rgba(13,13,16,0.95) 0%, rgba(22,22,28,0.98) 100%)",
};

type Props = {
  variant: FeaturePromoVariant;
  compact?: boolean;
  onNavigate?: () => void;
};

export function FeaturesPromoCard({
  variant,
  compact = false,
  onNavigate,
}: Props) {
  const { promo } = useFeaturesMenuLabel();

  return (
    <article
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]${
        compact ? " min-h-[280px]" : " min-h-[360px]"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ background: PROMO_GRADIENT[variant] }}
        aria-hidden
      />
      <div
        className={`relative z-[1] flex flex-1 flex-col ${
          compact ? "p-5" : "p-6"
        }`}
      >
        <span className="font-mono text-sm font-semibold tracking-wide text-[#ccff00]/85">
          {promo(`${variant}.label`)}
        </span>
        <h3 className="mt-3 text-2xl font-semibold leading-[0.95] tracking-wide text-white">
          {promo(`${variant}.headline`)}
        </h3>
        <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-400">
          {promo(`${variant}.description`)}
        </p>
        <Link
          href={promo(`${variant}.href`)}
          className="features-mega-promo-cta mt-auto inline-flex w-fit items-center justify-center rounded-full bg-[#ccff00] px-5 py-2.5 text-[13px] font-semibold text-zinc-950 no-underline transition-transform hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(204,255,0,0.45)]"
          onClick={onNavigate}
        >
          {promo(`${variant}.cta`)}
        </Link>
      </div>
    </article>
  );
}
