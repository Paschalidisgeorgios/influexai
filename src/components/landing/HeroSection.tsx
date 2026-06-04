"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { trackAbEvent, type AbVariant } from "@/lib/ab-tracking";
import { RotatingHeroHeadline } from "@/components/landing/RotatingHeroHeadline";

const GridReveal = dynamic(
  () => import("@/components/landing/GridReveal"),
  { ssr: false }
);

type Audience = "creator" | "brand";

const SOCIAL_AVATARS = ["MK", "JS", "AL", "TR", "PN"];

const HERO_CONTENT: Record<Audience, { headline: string[]; sub: string }> = {
  creator: {
    headline: ["Dein", "Gesicht.", "Deine Regeln."],
    sub: "Erstelle deinen KI-Influencer, streame live ohne Gesicht und generiere Produkt-Ads die konvertieren — in Minuten.",
  },
  brand: {
    headline: ["Dein KI-", "Marken-", "Botschafter."],
    sub: "Konsistente Markenkommunikation ohne teure Shootings. Produktvideos in 90 Sekunden. Skalierbar für KMUs und Agenturen.",
  },
};

export function HeroSection({ variant = "a" }: { variant?: AbVariant }) {
  const t = useTranslations("hero");
  const [audience, setAudience] = useState<Audience>("creator");
  const [scrollY, setScrollY] = useState(0);
  const isVariantB = variant === "b";
  const headlineParts = t("headline").split(/\s+—\s+/);
  const variantBContent = {
    headline:
      headlineParts.length >= 2
        ? [headlineParts[0], headlineParts.slice(1).join(" — ")]
        : [t("headline")],
    sub: t("subheadline"),
    cta: t("cta_primary"),
    ctaHref: "/auth/sign-up",
  };
  const content = isVariantB ? variantBContent : HERO_CONTENT[audience];
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
        <div className="flex items-center gap-2.5 mb-7">
          <div
            className="w-[7px] h-[7px] rounded-full bg-[#B4FF00] animate-blink"
            aria-hidden
          />
          <span className="kicker">{t("badge")} · 2026</span>
        </div>

        {!isVariantB && (
          <div className="flex items-center gap-2 mb-7 flex-wrap">
            {(["creator", "brand"] as Audience[]).map((a) => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 border"
                style={{
                  background: audience === a ? "#B4FF00" : "transparent",
                  borderColor:
                    audience === a ? "#B4FF00" : "rgba(255,255,255,0.13)",
                  color: audience === a ? "#060608" : "rgba(240,239,232,0.6)",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                {a === "creator" ? "Für Creator" : "Für Marken"}
              </button>
            ))}
          </div>
        )}

        {isVariantB ? (
          <h1
            className="mb-7"
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(3.2rem, 8vw, 7.5rem)",
              letterSpacing: "0.02em",
              lineHeight: 0.92,
            }}
          >
            {content.headline.map((line, i) => {
              const accentIndex = 2;
              return (
                <span key={i} className="block">
                  {i === accentIndex ? (
                    <span style={{ color: "#B4FF00" }}>{line}</span>
                  ) : (
                    line
                  )}
                </span>
              );
            })}
          </h1>
        ) : (
          <RotatingHeroHeadline titles={rotatingTitles} intervalMs={2000} />
        )}

        <p
          className="mb-8"
          style={{
            fontSize: "clamp(1rem, 1.8vw, 1.1rem)",
            color: "rgba(240,239,232,0.6)",
            lineHeight: 1.75,
            maxWidth: 440,
          }}
        >
          {content.sub}
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 mb-10">
          <a
            href={isVariantB ? variantBContent.ctaHref : "/auth/sign-up"}
            className="btn-acid justify-center sm:justify-start"
            onClick={() => void trackAbEvent("signup_click", variant)}
          >
            → {isVariantB ? variantBContent.cta : t("cta_primary")}
          </a>
          <a
            href="#features"
            className="btn-ghost justify-center sm:justify-start"
          >
            {t("cta_secondary")}
          </a>
        </div>

        {isVariantB && (
          <div
            className="flex items-center gap-3 mb-8 flex-wrap"
            style={{ fontSize: "0.82rem" }}
          >
            <div className="flex items-center" style={{ marginRight: 4 }}>
              {SOCIAL_AVATARS.map((initials, i) => (
                <div
                  key={initials}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(180,255,0,0.15)",
                    border: "2px solid #060608",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "#B4FF00",
                    marginLeft: i > 0 ? -10 : 0,
                    zIndex: SOCIAL_AVATARS.length - i,
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <span style={{ color: "rgba(240,239,232,0.45)" }}>
              Bereits von{" "}
              <strong style={{ color: "#B4FF00", fontWeight: 700 }}>
                500+
              </strong>{" "}
              Creators genutzt
            </span>
          </div>
        )}

        <div
          className="flex items-center gap-3 flex-wrap"
          style={{ fontSize: "0.82rem", color: "#505055" }}
        >
          {[`✓ ${t("trust_1")}`, `✓ ${t("trust_2")}`, `✓ ${t("trust_3")}`].map(
            (item, i) => (
              <span key={item} className="flex items-center gap-3">
                {i > 0 && (
                  <span
                    className="w-[3px] h-[3px] rounded-full inline-block"
                    style={{ background: "#505055" }}
                  />
                )}
                {item}
              </span>
            )
          )}
        </div>
      </div>

      {/* RIGHT: Hero image */}
      <div
        className="hidden lg:block relative z-[5] min-h-[min(85vh,720px)]"
        style={{
          padding: "24px clamp(20px,6vw,64px) 80px 12px",
        }}
      >
        <div className="relative h-full w-full min-h-[480px] rounded-2xl overflow-hidden border border-white/[0.08]">
          <Image
            src="/images/landing/hero.jpg"
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
    </section>
  );
}
