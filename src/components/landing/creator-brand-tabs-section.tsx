"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { LANDING_TOOL_EXAMPLES } from "@/lib/landing-tool-examples";
import { LightFrame } from "@/components/LightFrame";
import { LANDING_SECTION_CLASS } from "./section-styles";

const BRAND_FEAT_KEYS = ["feat1", "feat2", "feat3"] as const;
const BRAND_EX_KEYS = ["ex1", "ex2", "ex3"] as const;
const AVATAR_SLOTS = [1, 2, 3] as const;
const TOTAL_SLOTS = 50;

const BRAND_IMAGES = [
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=500&q=80&fit=crop",
  "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=500&q=80&fit=crop",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&q=80&fit=crop",
];

type AudienceTab = "creator" | "brand";

function useHashTabSync(setActiveTab: (tab: AudienceTab) => void) {
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (hash === "#brands") setActiveTab("brand");
      else if (hash === "#features") setActiveTab("creator");
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [setActiveTab]);
}

function AudienceTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-1 pb-2.5 text-[0.78rem] font-bold uppercase tracking-[0.14em] transition-colors duration-200"
      style={{ color: active ? "var(--white)" : "rgba(255,255,255,0.4)" }}
    >
      {label}
      <span
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-opacity duration-200"
        style={{
          background: "#B4FF00",
          opacity: active ? 1 : 0,
        }}
        aria-hidden
      />
    </button>
  );
}

function CreatorTabPanel() {
  const tFounding = useTranslations("founding");
  const tTools = useTranslations("landingPage.toolExamples");

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <div className="mx-auto max-w-[720px] text-center">
        <SpringReveal>
          <p
            className="mb-3 font-bold uppercase tracking-[0.22em]"
            style={{
              fontSize: 11,
              color: "var(--accent, #B4FF00)",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            {tFounding("kicker")}
          </p>
          <h3 className="landing-heading mb-4 text-[clamp(2rem,4vw,3rem)] leading-[0.95]">
            {tFounding("headline")}
          </h3>
          <p
            className="mx-auto mb-8 max-w-[560px] text-[0.95rem] leading-[1.7]"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {tFounding("subtext")}
          </p>
        </SpringReveal>

        <SpringReveal delay={0.08}>
          <div className="mb-8 flex flex-wrap items-start justify-center gap-5 sm:gap-6">
            {AVATAR_SLOTS.map((slot) => (
              <div
                key={slot}
                className="flex min-w-[88px] max-w-[110px] flex-col items-center gap-2"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed sm:h-[72px] sm:w-[72px]"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--accent, #B4FF00) 35%, transparent)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                  aria-hidden
                >
                  <span
                    className="text-lg font-light"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    ?
                  </span>
                </div>
                <p
                  className="m-0 text-[0.68rem] leading-snug"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {tFounding("slot_label", { slot, total: TOTAL_SLOTS })}
                </p>
              </div>
            ))}
          </div>
        </SpringReveal>

        <SpringReveal delay={0.12}>
          <AcidMotionButton
            href="/auth/sign-up"
            className="btn-acid justify-center rounded-full px-8 py-3"
          >
            → {tFounding("cta")}
          </AcidMotionButton>
          <p
            className="mt-3 text-[0.75rem]"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {tFounding("note")}
          </p>
        </SpringReveal>
      </div>

      <div>
        <SpringReveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="kicker mb-2 block">{tTools("kicker")}</span>
              <h3 className="landing-heading text-[clamp(2rem,4vw,3.5rem)]">
                {tTools("headline1")}
                <br />
                <span className="acid-highlight">{tTools("headline2")}</span>
              </h3>
            </div>
            <p
              className="hidden max-w-[280px] text-right text-sm leading-[1.65] sm:block"
              style={{ color: "var(--wd)" }}
            >
              {tTools("sidebar")}
            </p>
          </div>
        </SpringReveal>

        <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory -mx-[clamp(20px,6vw,64px)] px-[clamp(20px,6vw,64px)] lg:hidden [scrollbar-width:thin]">
          {LANDING_TOOL_EXAMPLES.map((tool, i) => (
            <SpringReveal key={tool.id} delay={(i % 4) * 0.08}>
              <Link
                href={tool.href}
                className="glass-card group flex w-[min(78vw,260px)] flex-shrink-0 snap-start flex-col overflow-hidden transition-all duration-300 hover:brightness-110"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={tool.image}
                    alt={tTools(`${tool.id}_title`)}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="260px"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 tool-card-overlay" aria-hidden />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3.5">
                  <h4 className="tool-card-name group-hover:text-[#caffb0] transition-colors">
                    {tTools(`${tool.id}_title`)}
                  </h4>
                  <p className="tool-card-desc">{tTools(`${tool.id}_desc`)}</p>
                </div>
              </Link>
            </SpringReveal>
          ))}
        </div>

        <div
          className="hidden lg:block columns-3 gap-3"
          style={{ columnFill: "balance" }}
        >
          {LANDING_TOOL_EXAMPLES.map((tool, i) => (
            <SpringReveal key={tool.id} delay={(i % 4) * 0.08}>
              <Link
                href={tool.href}
                className="glass-card group mb-3 break-inside-avoid flex flex-col overflow-hidden transition-all duration-300 hover:brightness-110"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={tool.image}
                    alt={tTools(`${tool.id}_title`)}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 tool-card-overlay" aria-hidden />
                </div>
                <div className="flex flex-col gap-1.5 p-4">
                  <h4 className="tool-card-name group-hover:text-[#caffb0] transition-colors">
                    {tTools(`${tool.id}_title`)}
                  </h4>
                  <p className="tool-card-desc">{tTools(`${tool.id}_desc`)}</p>
                </div>
              </Link>
            </SpringReveal>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandTabPanel() {
  const t = useTranslations("landingPage.brands");
  const locale = useLocale();

  return (
    <div id="brands" className="world-brand min-w-0">
      <div
        lang={locale}
        className="mb-8 grid w-full min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10"
      >
        <div className="min-w-0 max-w-full">
          <span className="kicker mb-2 block">{t("kicker")}</span>
          <span
            className="block"
            style={{
              width: 32,
              height: 2,
              background: "var(--accent, var(--acid))",
              borderRadius: 2,
              margin: "10px 0 16px",
            }}
          />
          <h3
            lang={locale}
            className="brand-section-headline landing-heading w-full min-w-0 max-w-full text-[clamp(2rem,4.5vw,3.75rem)] leading-[1.08] break-words hyphens-auto"
          >
            {t("headline1")}
            <br />
            {t("headline2")}
            <br />
            <span className="acid-highlight">{t("headline3")}</span>
          </h3>
        </div>
        <div className="min-w-0 max-w-full">
          <p
            className="mb-5 max-w-full text-[0.9rem] leading-[1.7]"
            style={{ color: "var(--wd)", maxWidth: 420 }}
          >
            {t("intro")}
          </p>
          <div className="flex flex-col gap-2.5">
            {BRAND_FEAT_KEYS.map((key, i) => (
              <div
                key={key}
                className="flex items-start gap-3 rounded-[10px]"
                style={{
                  padding: "12px 14px",
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="flex-shrink-0"
                  style={{
                    fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                    fontSize: "1.25rem",
                    color: "var(--acid)",
                    lineHeight: 1,
                    width: 26,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0">
                  <div
                    className="mb-0.5 text-sm font-bold"
                    style={{ color: "var(--white)" }}
                  >
                    {t(`${key}_title`)}
                  </div>
                  <div
                    className="text-[0.78rem] leading-[1.55]"
                    style={{ color: "var(--wd)" }}
                  >
                    {t(`${key}_desc`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BRAND_EX_KEYS.map((key, i) => (
          <LightFrame key={key} className="img-card aspect-[3/4] rounded-[14px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_IMAGES[i]}
              alt={t(`${key}_title`)}
              style={{
                filter: "brightness(0.75) saturate(1.2)",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(6,6,8,0.92) 0%, transparent 55%)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div
                className="mb-0.5 text-[0.62rem] font-bold uppercase tracking-[0.06em]"
                style={{ color: "var(--accent, var(--acid))" }}
              >
                {t(`${key}_cat`)}
              </div>
              <div
                className="feat-card-title text-[0.78rem] leading-[1.3]"
                style={{ letterSpacing: "0.08em" }}
              >
                {t(`${key}_title`)}
              </div>
              <div className="feat-card-desc mt-0.5 text-[0.65rem]">
                {t(`${key}_sub`)}
              </div>
            </div>
          </LightFrame>
        ))}
      </div>
    </div>
  );
}

export function CreatorBrandTabsSection() {
  const tTabs = useTranslations("landingPage.worldTransition");
  const [activeTab, setActiveTab] = useState<AudienceTab>("creator");

  useHashTabSync(setActiveTab);

  return (
    <section
      id="features"
      className={LANDING_SECTION_CLASS}
      style={{ background: "#060608" }}
    >
      <div className="mx-auto w-full max-w-[1160px]">
        <SpringReveal>
          <div className="mb-8 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <p
              className="m-0 text-center text-[0.72rem] font-bold uppercase tracking-[0.18em] sm:text-left"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {tTabs("tagline")}
            </p>
            <div
              className="flex items-center gap-8 border-b"
              style={{ borderColor: "var(--border)" }}
              role="tablist"
              aria-label={tTabs("tagline")}
            >
              <AudienceTabButton
                active={activeTab === "creator"}
                label={tTabs("creator")}
                onClick={() => setActiveTab("creator")}
              />
              <AudienceTabButton
                active={activeTab === "brand"}
                label={tTabs("brand")}
                onClick={() => setActiveTab("brand")}
              />
            </div>
          </div>
        </SpringReveal>

        <div role="tabpanel">
          {activeTab === "creator" ? <CreatorTabPanel /> : <BrandTabPanel />}
        </div>
      </div>
    </section>
  );
}
