"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";

export function LandingValueSection() {
  const t = useTranslations("landingPage.value");

  return (
    <section
      id="value"
      className="border-t border-white/[0.06] bg-[#060608] px-[clamp(20px,6vw,64px)] py-20 md:py-28"
    >
      <SpringReveal>
        <div className="mx-auto max-w-[720px] rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center md:px-12 md:py-14">
          <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,5vw,3rem)] font-normal leading-[0.95] tracking-[0.02em] text-zinc-100">
            {t("headline")}
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-base leading-relaxed text-zinc-300 md:text-lg">
            {t("body")}
          </p>
          <div className="mt-8 flex flex-col flex-wrap items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <AcidMotionButton
              href="/dashboard/ki-agent"
              className="btn-acid min-h-[44px] justify-center"
            >
              {t("cta_primary")}
            </AcidMotionButton>
            <Link
              href="/pricing"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/[0.14] px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-[#B4FF00]/35 hover:text-[#B4FF00]"
            >
              {t("cta_secondary")}
            </Link>
          </div>
        </div>
      </SpringReveal>
    </section>
  );
}
