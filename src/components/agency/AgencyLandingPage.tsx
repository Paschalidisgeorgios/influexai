"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Brush, Users, Rocket, ChevronDown } from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
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

export function AgencyLandingPage() {
  const t = useTranslations("agencyPage");
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
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
    <div className="min-h-screen bg-[#060608] text-[#F0EFE8] landing-root">
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
              <AcidMotionButton href="#agency-demo" className="btn-ghost">
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
                <div className="h-full rounded-2xl border border-white/10 bg-[#0f0f12] p-7 hover:border-[#B4FF00]/30 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-[#B4FF00]/10 flex items-center justify-center mb-5">
                    <Icon size={22} color="#B4FF00" strokeWidth={2} />
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
      <section className="py-20 px-[clamp(20px,6vw,64px)] bg-[#0a0a0c]">
        <div className="max-w-[800px] mx-auto">
          <RevealUp>
            <span className="kicker mb-3">{t("how.kicker")}</span>
            <h2 className="landing-heading text-4xl mb-12">{t("how.headline")}</h2>
          </RevealUp>
          <div className="relative pl-8 border-l border-[#B4FF00]/25 space-y-10">
            {STEP_KEYS.map((key, i) => (
              <RevealUp key={key} delay={i * 0.06}>
                <div className="relative">
                  <span className="absolute -left-[calc(2rem+5px)] top-0 w-10 h-10 rounded-full bg-[#B4FF00] text-[#060608] font-bold flex items-center justify-center text-sm">
                    {i + 1}
                  </span>
                  <h3 className="font-bold text-[#F0EFE8] mb-1">
                    {t(`how.${key}_title`)}
                  </h3>
                  <p className="text-sm text-white/80">{t(`how.${key}_text`)}</p>
                </div>
              </RevealUp>
            ))}
          </div>
        </div>
      </section>

      {/* Demo mockup */}
      <section
        id="agency-demo"
        className="py-20 px-[clamp(20px,6vw,64px)]"
      >
        <div className="max-w-[960px] mx-auto text-center mb-10">
          <span className="kicker mb-3">{t("demo.kicker")}</span>
          <h2 className="landing-heading text-4xl">{t("demo.headline")}</h2>
        </div>
        <RevealUp>
          <div
            className="max-w-[900px] mx-auto rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
          >
            <div
              className="flex items-center gap-3 px-5 py-3 border-b border-white/10"
              style={{ background: "#0f0f12" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ background: "#7C3AED", color: "#fff" }}
              >
                A
              </div>
              <span className="font-semibold text-sm" style={{ color: "#7C3AED" }}>
                {t("demo.agency_name")}
              </span>
              <span className="ml-auto text-[0.65rem] text-white/65 px-2 py-1 rounded border border-white/10">
                {t("demo.powered_by")}
              </span>
            </div>
            <div className="flex min-h-[280px]">
              <div
                className="w-48 shrink-0 p-4 border-r border-white/10 hidden sm:block"
                style={{ background: "#0a0a0c" }}
              >
                {["Script", "KI-Ich", "Live Creator", "Remix"].map((item) => (
                  <div
                    key={item}
                    className="py-2 px-3 rounded-lg text-xs mb-1"
                    style={{
                      color: item === "Script" ? "#7C3AED" : "rgba(255,255,255,0.45)",
                      background:
                        item === "Script" ? "rgba(124,58,237,0.15)" : "transparent",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-6" style={{ background: "#060608" }}>
                <p className="text-xs text-white/70 mb-2">{t("demo.workspace")}</p>
                <div
                  className="h-32 rounded-xl border border-dashed flex items-center justify-center text-sm"
                  style={{
                    borderColor: "rgba(124,58,237,0.35)",
                    color: "rgba(124,58,237,0.7)",
                    background: "rgba(124,58,237,0.06)",
                  }}
                >
                  {t("demo.placeholder")}
                </div>
              </div>
            </div>
          </div>
        </RevealUp>
      </section>

      {/* Pricing */}
      <section
        id="agency-pricing"
        className="py-20 px-[clamp(20px,6vw,64px)] bg-[#0a0a0c] border-t border-white/[0.06]"
      >
        <div className="max-w-[1100px] mx-auto text-center">
          <span className="kicker mb-3">{t("pricing.kicker")}</span>
          <h2 className="landing-heading text-4xl mb-4">{t("pricing.headline")}</h2>
          <p className="text-white/80 text-sm mb-8 max-w-lg mx-auto">
            {t("pricing.setup_hint")}
          </p>

          <div className="max-w-md mx-auto text-left mb-10 p-5 rounded-xl border border-white/10 bg-[#0f0f12]">
            <label className="block mb-3 text-sm text-[rgba(255,255,255,0.65)]">
              {t("pricing.agency_name_label")}
              <input
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder={t("pricing.agency_name_placeholder")}
                className="mt-2 w-full px-3 py-2.5 rounded-lg border border-white/10 bg-[#18181d] text-[#F0EFE8] text-sm"
              />
            </label>
            <label className="block text-sm text-[rgba(255,255,255,0.65)]">
              {t("pricing.slug_label")}
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                placeholder={t("pricing.slug_placeholder")}
                className="mt-2 w-full px-3 py-2.5 rounded-lg border border-white/10 bg-[#18181d] text-[#F0EFE8] text-sm"
              />
            </label>
          </div>

          <div
            className="inline-flex p-1 rounded-[10px] mb-10 mx-auto"
            style={{ background: "#18181d", border: "1px solid rgba(255,255,255,0.07)" }}
          >
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
                  background: yearly === isY ? "#F0EFE8" : "transparent",
                  color: yearly === isY ? "#060608" : "rgba(255,255,255,0.65)",
                }}
              >
                {label}
                {isY && (
                  <span className="ml-1.5 text-[0.65rem] font-bold px-1.5 py-0.5 rounded bg-[#B4FF00]/15 text-[#B4FF00]">
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
                  className={`relative flex flex-col rounded-2xl p-7 border ${
                    plan.popular ? "border-[#B4FF00]/40 bg-[#B4FF00]/[0.04]" : "border-white/10 bg-[#0f0f12]"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#B4FF00] text-[#060608] text-[0.7rem] font-bold px-4 py-1 rounded-full whitespace-nowrap">
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
                        <span className="text-[#B4FF00]">✓</span>
                        {t(`pricing.${fk}`)}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => checkout(planId)}
                    className={`w-full py-3 rounded-lg font-bold text-sm border-none cursor-pointer transition-opacity ${
                      plan.popular
                        ? "bg-[#B4FF00] text-[#060608]"
                        : "bg-white/5 text-[#F0EFE8] border border-white/10"
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

      {/* FAQ */}
      <section className="py-20 px-[clamp(20px,6vw,64px)]">
        <div className="max-w-[720px] mx-auto">
          <h2 className="landing-heading text-4xl text-center mb-10">{t("faq.headline")}</h2>
          <div className="flex flex-col gap-2">
            {FAQ_KEYS.map((key, i) => (
              <div
                key={key}
                className="rounded-xl border border-white/10 bg-[#0f0f12] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left bg-transparent border-none text-[#F0EFE8] font-semibold text-sm cursor-pointer"
                >
                  {t(`faq.${key}`)}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#B4FF00] transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-white/80 leading-relaxed">
                    {t(`faq.a${key.slice(1)}`)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-[clamp(20px,6vw,64px)] border-t border-white/[0.06]">
        <div
          className="max-w-[900px] mx-auto text-center rounded-2xl p-12 border border-[#B4FF00]/25"
          style={{
            background:
              "linear-gradient(135deg, rgba(180,255,0,0.06) 0%, rgba(6,6,8,0.9) 60%)",
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

      <footer className="py-8 text-center text-xs text-[rgba(255,255,255,0.65)] border-t border-white/[0.06]">
        <Link href="/" className="text-[#B4FF00] no-underline hover:underline">
          ← InfluexAI
        </Link>
      </footer>
    </div>
  );
}
