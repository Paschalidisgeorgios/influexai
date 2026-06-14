"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { getStarterPriceParams } from "@/lib/pricing";

const PROOF_CARDS = [
  { id: "tiktok_script", image: "/images/examples/script.jpg" },
  { id: "product_ad", image: "/images/examples/product.jpg" },
  { id: "content_plan", image: "/images/examples/niche.jpg" },
  { id: "creator_visual", image: "/images/examples/avatar.jpg" },
  { id: "video_motion", image: "/images/examples/remix.jpg" },
] as const;

const PROOF_BULLETS = [
  "bullet_1",
  "bullet_2",
  "bullet_3",
  "bullet_4",
  "bullet_5",
] as const;

function kiAgentHref(prompt: string) {
  return `/dashboard/ki-agent?prompt=${encodeURIComponent(prompt)}`;
}

function ProofDemoCard({
  image,
  title,
  benefit,
  prompt,
  ctaFreePlan,
  ctaWorkflow,
  previewNote,
}: {
  image: string;
  title: string;
  benefit: string;
  prompt: string;
  ctaFreePlan: string;
  ctaWorkflow: string;
  previewNote: string;
}) {
  return (
    <article className="glass-card flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, 100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 tool-card-overlay" aria-hidden />
        <span
          className="absolute left-2 top-2 rounded-[6px] px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.06em]"
          style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(180,255,0,0.35)",
            color: "#B4FF00",
          }}
        >
          Demo
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4 md:p-5">
        <h3 className="text-base font-bold tracking-[-0.02em] text-white md:text-[1.05rem]">
          {title}
        </h3>
        <p className="text-[0.82rem] leading-[1.55] text-white/68">{benefit}</p>
        <div
          className="rounded-[8px] border px-3 py-2 text-[0.78rem] leading-[1.5] text-white/62"
          style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
        >
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/60">
            Prompt ·{" "}
          </span>
          {prompt}
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <Link
            href={kiAgentHref(prompt)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#B4FF00] px-4 py-2 text-[0.8rem] font-bold text-[#060608] transition-opacity hover:brightness-105"
          >
            {ctaFreePlan}
          </Link>
          <Link
            href="#stacked-demo"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/[0.14] px-4 py-2 text-[0.8rem] font-semibold text-white/75 transition-colors hover:border-[#B4FF00]/35 hover:text-[#B4FF00]"
          >
            {ctaWorkflow}
          </Link>
          <p className="text-center text-[0.68rem] leading-snug text-white/60">{previewNote}</p>
        </div>
      </div>
    </article>
  );
}

export function LandingProofSection() {
  const t = useTranslations("landingPage.proof");
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);

  return (
    <section
      id="proof"
      className="w-full max-w-[100vw] overflow-x-hidden px-[clamp(16px,5vw,64px)] py-12 md:py-16 lg:py-20"
      style={{ background: "var(--bg-1)" }}
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <div className="mx-auto mb-8 max-w-[720px] text-center md:mb-10">
            <span className="kicker mb-2 block">{t("kicker")}</span>
            <h2 className="landing-heading mb-3 text-[clamp(1.75rem,4vw,3rem)]">
              {t("headline")}
            </h2>
            <p className="text-[0.9rem] leading-[1.65] text-white/65">{t("intro")}</p>
            <ul className="mx-auto mt-4 inline-flex flex-col gap-1.5 text-left text-[0.85rem] text-white/72 sm:items-center">
              {PROOF_BULLETS.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-[0.35rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B4FF00]" aria-hidden />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </SpringReveal>

        <SpringReveal delay={0.05}>
          <p className="mb-4 text-center text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#B4FF00]/75">
            {t("demo_label")}
          </p>
        </SpringReveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {PROOF_CARDS.map((card, i) => (
            <SpringReveal key={card.id} delay={(i % 3) * 0.06} className={i >= 3 ? "lg:col-span-1" : ""}>
              <ProofDemoCard
                image={card.image}
                title={t(`cards.${card.id}.title`)}
                benefit={t(`cards.${card.id}.benefit`)}
                prompt={t(`cards.${card.id}.prompt`)}
                ctaFreePlan={t("cta_free_plan")}
                ctaWorkflow={t("cta_workflow")}
                previewNote={t("preview_note")}
              />
            </SpringReveal>
          ))}
        </div>

        <SpringReveal delay={0.1}>
          <div
            className="mx-auto mt-10 max-w-[960px] rounded-[12px] border px-4 py-5 text-center md:mt-12 md:px-6"
            style={{
              borderColor: "rgba(180,255,0,0.18)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p className="text-[0.88rem] leading-[1.65] text-white/75">
              {t("pricing_bridge", priceParams)}
            </p>
            <div className="mt-4 flex flex-col flex-wrap items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
              <AcidMotionButton href="/pricing" className="btn-acid min-h-[44px] justify-center">
                {t("cta_choose_plan")}
              </AcidMotionButton>
              <Link
                href="/dashboard/ki-agent"
                className="btn-ghost inline-flex min-h-[44px] items-center justify-center"
              >
                {t("cta_free_plan")}
              </Link>
              <Link
                href="/auth/sign-in"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/[0.12] px-5 py-2.5 text-[0.82rem] font-semibold text-white/70 transition-colors hover:border-[#B4FF00]/30 hover:text-[#B4FF00]"
              >
                {t("cta_dashboard")}
              </Link>
            </div>
          </div>
        </SpringReveal>
      </div>
    </section>
  );
}

export default LandingProofSection;
