"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { formatStarterFromPrice } from "@/lib/pricing";

type Props = {
  open: boolean;
};

/** Non-blocking inline banner — no fixed overlay (keeps dashboard forms clickable). */
export function NoPlanModal({ open }: Props) {
  const t = useTranslations("planGate");
  const locale = useLocale();

  if (!open) return null;

  const price = formatStarterFromPrice(locale);

  return (
    <div
      role="alert"
      className="relative z-10 mb-4 w-full max-w-3xl rounded-2xl border border-[#B4FF00]/25 bg-[#0f0f12] p-6 shadow-lg pointer-events-auto"
    >
      <p className="text-[#B4FF00] text-xs font-bold uppercase tracking-[0.14em] mb-2">
        {t("kicker")}
      </p>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-[#F0EFE8] mb-2 leading-tight">
        {t("title")}
      </h2>
      <p className="text-white/80 text-sm mb-6 leading-relaxed">
        {t("body", { price })}
      </p>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <AcidMotionButton href="/pricing" className="btn-acid flex-1 justify-center">
          {t("cta")}
        </AcidMotionButton>
        <Link
          href="/dashboard"
          className="btn-ghost flex-1 justify-center text-center py-2.5"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
