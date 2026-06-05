"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { trackAbEvent, type AbVariant } from "@/lib/ab-tracking";
import { HeroTitle } from "@/components/landing/HeroTitle";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { useParallax } from "@/components/use-parallax";

const GridReveal = dynamic(
  () => import("@/components/landing/GridReveal"),
  { ssr: false }
);

type Audience = "creator" | "brand";

function HeroImage() {
  const ref = useRef<HTMLDivElement>(null);
  useParallax(ref);

  return (
    <div className="overflow-hidden aspect-[3/4] rounded-2xl border border-white/[0.08]">
      <div ref={ref} className="relative w-full h-full min-h-[480px]">
        <Image
          src="/images/landing/feature-1.png"
          alt="Creator mit InfluexAI"
          fill
          className="object-cover"
          style={{ filter: "brightness(0.88) saturate(1.1)" }}
          priority
          sizes="(min-width: 1024px) 50vw, 0px"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(6,6,8,0.75) 0%, transparent 45%), linear-gradient(to left, rgba(6,6,8,0.4) 0%, transparent 40%)",
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function HeroSection({ variant = "a" }: { variant?: AbVariant }) {
  const t = useTranslations("hero");
  const [audience, setAudience] = useState<Audience>("creator");
  const [scrollY, setScrollY] = useState(0);
  const rawRotating = t.raw("rotating_titles");
  const rotatingTitles = Array.isArray(rawRotating)
    ? (rawRotating as string[])
    : [];

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="landing-hero-sentinel"
      className="relative min-h-screen grid lg:grid-cols-2 grid-cols-1 overflow-hidden pt-[76px]"
    >
      {/* Background: grid base + interactive reveal */}
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
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[1] md:hidden"
          style={{
            backgroundImage: `
              linear-gradient(rgba(180,255,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(180,255,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />
        <GridReveal />
      </div>

      {/* Vignette — blends hero image into Acid Noir bg */}
      <div
        className="absolute inset-0 z-[4] pointer-events-none hidden lg:block"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 70% 50%, transparent 30%, #060608 80%)",
        }}
        aria-hidden
      />

      {/* LEFT: Copy */}
      <div
        className="flex flex-col justify-center relative z-10"
        style={{
          padding:
            "clamp(40px,6vw,72px) clamp(20px,4vw,48px) clamp(60px,8vw,90px) clamp(20px,6vw,64px)",
          transform: `translateY(${scrollY * 0.06}px)`,
          transition: "transform 0.1s linear",
        }}
      >
        <SpringReveal>
          <div className="flex items-center gap-2.5 mb-7">
          <div
            className="w-[7px] h-[7px] rounded-full bg-[var(--accent,#B4FF00)] animate-blink"
            aria-hidden
          />
          <span className="kicker">{t("badge")} · 2026</span>
        </div>
        </SpringReveal>

        <SpringReveal delay={0.08}>
        <div className="flex items-center gap-2 mb-7 flex-wrap">
          {(["creator", "brand"] as Audience[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 border"
              style={{
                background: audience === a ? "var(--accent, #B4FF00)" : "transparent",
                borderColor:
                  audience === a ? "var(--accent, #B4FF00)" : "rgba(255,255,255,0.13)",
                color: audience === a ? "#060608" : "rgba(255,255,255,0.85)",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              {a === "creator" ? "Für Creator" : "Für Marken"}
            </button>
          ))}
        </div>
        </SpringReveal>

        <SpringReveal delay={0.12}>
        <HeroTitle titles={rotatingTitles} />
        </SpringReveal>

        <SpringReveal delay={0.16}>
        <p className="hero-subtitle mb-8 max-w-[440px]">
          {audience === "creator" ? t("creator_subtitle") : t("brand_subtitle")}
        </p>
        </SpringReveal>

        <SpringReveal delay={0.4}>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 mb-10">
          <AcidMotionButton
            href="/auth/sign-up"
            className="btn-acid justify-center sm:justify-start"
            onClick={() => void trackAbEvent("signup_click", variant)}
          >
            → {t("cta_primary")}
          </AcidMotionButton>
          <a
            href="#features"
            className="btn-ghost justify-center sm:justify-start"
          >
            {t("cta_secondary")}
          </a>
        </div>
        </SpringReveal>

        <SpringReveal delay={0.24}>
        <div
          className="flex items-center gap-3 flex-wrap"
          style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)" }}
        >
          {[`✓ ${t("trust_1")}`, `✓ ${t("trust_2")}`, `✓ ${t("trust_3")}`].map(
            (item, i) => (
              <span key={item} className="flex items-center gap-3">
                {i > 0 && (
                  <span
                    className="w-[3px] h-[3px] rounded-full inline-block"
                    style={{ background: "rgba(255,255,255,0.65)" }}
                  />
                )}
                {item}
              </span>
            )
          )}
        </div>
        </SpringReveal>
      </div>

      {/* RIGHT: Hero image */}
      <div
        className="hidden lg:flex relative z-[5] items-center min-h-[min(85vh,720px)]"
        style={{
          padding: "24px clamp(20px,6vw,64px) 80px 12px",
        }}
      >
        <HeroImage />
      </div>
    </section>
  );
}
