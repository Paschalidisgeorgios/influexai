"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Brush, Users, Rocket } from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { StudioGlassShell } from "@/components/ui/StudioGlassShell";
import { AgencyGlassFaq } from "@/components/agency/AgencyGlassFaq";
import { WhitelabelLivePreview } from "@/components/agency/WhitelabelLivePreview";
import { RevealUp } from "@/components/ui/ScrollReveal";
import {
  AGENCY_PLAN_ORDER,
  AGENCY_PLANS,
  type AgencyPlanId,
  type BillingInterval,
} from "@/lib/agency-plans";
import { createClient } from "@/lib/supabase/client";

const GridReveal = dynamic(
  () => import("@/components/landing/GridReveal"),
  { ssr: false }
);

const FEATURE_ICONS = [Brush, Users, Rocket] as const;
const FEATURE_KEYS = ["f1", "f2", "f3"] as const;
const STEP_KEYS = ["s1", "s2", "s3", "s4"] as const;
const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;
const NEON = "#ccff00";

export function AgencyLandingPage() {
  const t = useTranslations("agencyPage");
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [slug, setSlug] = useState("");
  const interval: BillingInterval = yearly ? "yearly" : "monthly";

  const checkout = async (planId: AgencyPlanId) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = `/auth/sign-up?plan=agency&redirect=${encodeURIComponent("/agency")}`;
      return;
    }

    setLoading(`${planId}-${interval}`);
    try {
      const res = await fetch("/api/agency/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          billingInterval: interval,
          agencyName,
          slug,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else
        alert(
          data.error ??
            "Dieser Plan ist aktuell nicht verfügbar. Bitte kontaktiere den Support."
        );
    } catch {
      alert("Checkout fehlgeschlagen.");
    }
    setLoading(null);
  };

  return (
    <StudioGlassShell className="landing-root">
      <LandingNav agencyMode />
      <section
        id="landing-hero-sentinel"
        className="relative min-h-[85vh] flex items-center overflow-hidden pt-24 pb-16 px-[clamp(20px,6vw,64px)]"
      >
        <div className="absolute inset-0 z-0" aria-hidden>
          <div
            className="absolute inset-0 z-[1] hidden md:block"
            style={{
              backgroundImage: `
                linear-gradient(rgba(180,255,0,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(180,255,0,0.04) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
          <GridReveal />
        </div>
        <div className="relative z-10 max-w-[900px]">
          <RevealUp>
            <span className="kicker mb-4">{t("hero.kicker")}</span>
            <h1 className="landing-heading text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.92] whitespace-pre-line mb-6">
              {t("hero.headline")}
            </h1>
            <p className="text-lg text-white/80 max-w-xl leading-relaxed mb-8 whitespace-pre-line">
              {t("hero.subline")}
            </p>
            <div className="flex flex-wrap gap-3">
              <AcidMotionButton href="#agency-pricing" className="btn-acid">
                {t("hero.cta_primary")}
              </AcidMotionButton>
              <AcidMotionButton href="#agency-whitelabel" className="btn-ghost">
                {t("hero.cta_secondary")}
              </AcidMotionButton>
            </div>
          </RevealUp>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-[clamp(20px,6vw,64px)] border-t border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURE_KEYS.map((key, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <RevealUp key={key} delay={i * 0.08}>
                <div className="h-full studio-glass-card studio-glass-card--hover p-7">
                  <div className="studio-glass-icon-wrap mb-5">
                    <Icon size={22} color={NEON} strokeWidth={2} />
                  </div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest antialiased">
                    {t(`features.${key}_title`)}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed mt-2 whitespace-pre-line">
                    {t(`features.${key}_text`)}
                  </p>
                </div>
              </RevealUp>
            );
          })}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-[clamp(20px,6vw,64px)] border-t border-zinc-800/40">
        <div className="max-w-[800px] mx-auto">
          <RevealUp>
            <span className="studio-glass-kicker">{t("how.kicker")}</span>
            <h2 className="landing-heading text-4xl mb-12">{t("how.headline")}</h2>
          </RevealUp>
          <div className="relative">
            {STEP_KEYS.map((key, i) => (
              <RevealUp key={key} delay={i * 0.06}>
                <div className="relative mb-8 flex items-start gap-6 last:mb-0">
                  {i < STEP_KEYS.length - 1 ? (
                    <span
                      className="pointer-events-none absolute left-5 top-10 z-0 h-[calc(100%+2rem-2.5rem)] w-px -translate-x-1/2 bg-zinc-800"
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className="relative z-[1] flex h-10 w-10 min-w-[40px] shrink-0 items-center justify-center rounded-full bg-[#ccff00] font-mono text-sm font-bold text-black"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div className="relative z-[1] min-w-0 flex-1 pt-0.5">
                    <p
                      role="heading"
                      aria-level={3}
                      className="mb-1 block font-sans text-lg font-extrabold uppercase tracking-wide leading-snug text-white"
                    >
                      {t(`how.${key}_title`)}
                    </p>
                    <p className="font-sans text-sm font-normal leading-relaxed text-zinc-400">
                      {t(`how.${key}_text`)}
                    </p>
                  </div>
                </div>
              </RevealUp>
            ))}
          </div>
        </div>
      </section>

      <WhitelabelLivePreview
        agencyName={agencyName}
        onAgencyNameChange={setAgencyName}
      />

      {/* Pricing */}
      <section
        id="agency-pricing"
        className="py-20 px-[clamp(20px,6vw,64px)] border-t border-zinc-800/40"
      >
        <div className="max-w-[1100px] mx-auto text-center">
          <span className="kicker mb-3">{t("pricing.kicker")}</span>
          <h2 className="landing-heading text-4xl mb-4">{t("pricing.headline")}</h2>
          <p className="text-white/80 text-sm mb-8 max-w-lg mx-auto">
            {t("pricing.setup_hint")}
          </p>

          <div className="max-w-md mx-auto text-left mb-10 p-5 studio-glass-card">
            <label className="block mb-3 text-sm text-white/65">
              {t("pricing.agency_name_label")}
              <input
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder={t("pricing.agency_name_placeholder")}
                className="studio-glass-input mt-2"
              />
            </label>
            <label className="block text-sm text-white/65">
              {t("pricing.slug_label")}
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                placeholder={t("pricing.slug_placeholder")}
                className="studio-glass-input mt-2"
              />
            </label>
          </div>

          <div className="inline-flex p-1 rounded-[10px] mb-10 mx-auto studio-glass-card">
            {(
              [
                { label: t("pricing.monthly"), isY: false },
                { label: t("pricing.yearly"), isY: true },
              ] as const
            ).map(({ label, isY }) => (
              <button
                key={label}
                type="button"
                onClick={() => setYearly(isY)}
                className="px-5 py-2 rounded-[7px] text-sm font-semibold cursor-pointer border-none transition-all"
                style={{
                  background: yearly === isY ? NEON : "transparent",
                  color: yearly === isY ? "#000" : "rgba(255,255,255,0.65)",
                }}
              >
                {label}
                {isY && (
                  <span className="ml-1.5 text-[0.65rem] font-bold px-1.5 py-0.5 rounded bg-[#ccff00]/15 text-[#ccff00]">
                    −20%
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {AGENCY_PLAN_ORDER.map((planId) => {
              const plan = AGENCY_PLANS[planId];
              const price =
                interval === "yearly"
                  ? plan.yearlyPricePerMonthEur
                  : plan.monthlyPriceEur;
              const featureKeys =
                planId === "starter"
                  ? (["starter_f1", "starter_f2", "starter_f3", "starter_f4"] as const)
                  : planId === "pro"
                    ? (["pro_f1", "pro_f2", "pro_f3", "pro_f4", "pro_f5"] as const)
                    : (["ent_f1", "ent_f2", "ent_f3", "ent_f4", "ent_f5", "ent_f6"] as const);
              const isLoading = loading === `${planId}-${interval}`;

              return (
                <div
                  key={planId}
                  className={`relative flex flex-col rounded-2xl p-7 border studio-glass-card ${
                    plan.popular ? "border-[#ccff00]/40" : "border-zinc-800/60"
                  }`}
                  style={plan.popular ? { background: "rgba(204,255,0,0.04)" } : undefined}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ccff00] text-black text-[0.7rem] font-bold px-4 py-1 rounded-full whitespace-nowrap">
                      {t("pricing.popular")}
                    </span>
                  )}
                  <p className="text-xs font-bold uppercase tracking-wider text-[rgba(255,255,255,0.65)] mb-2">
                    {t(`pricing.${planId}_name`)}
                  </p>
                  <div className="font-[family-name:var(--font-bebas)] text-5xl leading-none mb-1">
                    €{price}
                    <span className="text-sm text-[rgba(255,255,255,0.65)] font-[family-name:var(--font-dm)]">
                      {t("pricing.per_month")}
                    </span>
                  </div>
                  <ul className="mt-5 mb-6 flex flex-col gap-2 flex-1">
                    {featureKeys.map((fk) => (
                      <li key={fk} className="flex gap-2 text-sm text-white/70">
                        <span className="text-[#ccff00]">✓</span>
                        {t(`pricing.${fk}`)}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => checkout(planId)}
                    className={`w-full py-3 rounded-lg font-bold text-sm border-none cursor-pointer transition-all hover:scale-[1.02] ${
                      plan.popular
                        ? "bg-[#ccff00] text-black"
                        : "bg-white/5 text-[#F0EFE8] border border-zinc-800/60"
                    }`}
                    style={{ opacity: isLoading ? 0.7 : 1 }}
                  >
                    {isLoading ? "…" : t("pricing.cta")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AgencyGlassFaq
        headline={t("faq.headline")}
        items={FAQ_KEYS.map((key) => ({
          question: t(`faq.${key}`),
          answer: t(`faq.a${key.slice(1)}`),
        }))}
      />

      {/* CTA */}
      <section className="py-16 px-[clamp(20px,6vw,64px)] border-t border-zinc-800/40">
        <div
          className="max-w-[900px] mx-auto text-center rounded-2xl p-12 studio-glass-card border-[#ccff00]/25"
          style={{
            background:
              "linear-gradient(135deg, rgba(204,255,0,0.06) 0%, rgba(5,5,5,0.9) 60%)",
          }}
        >
          <h2 className="landing-heading text-3xl md:text-4xl mb-6">
            {t("cta.headline")}
          </h2>
          <AcidMotionButton
            href="/auth/sign-up?plan=agency"
            className="btn-acid justify-center"
          >
            {t("cta.button")}
          </AcidMotionButton>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-white/65 border-t border-zinc-800/40">
        <Link href="/" className="text-[#ccff00] no-underline hover:underline">
          ← InfluexAI
        </Link>
      </footer>
    </StudioGlassShell>
  );
}
