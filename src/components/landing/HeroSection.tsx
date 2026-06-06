"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { trackAbEvent, type AbVariant } from "@/lib/ab-tracking";
import { getStarterPriceParams } from "@/lib/pricing";
import { HeroTitle } from "@/components/landing/HeroTitle";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { useParallax } from "@/components/use-parallax";

const GridReveal = dynamic(
  () => import("@/components/landing/GridReveal"),
  { ssr: false }
);

type Audience = "creator" | "brand";

type HeroMediaItem =
  | { type: "image"; src: string; alt?: string }
  | { type: "video"; src: string; poster: string };

const HERO_MEDIA_ITEMS: HeroMediaItem[] = [
  { type: "image", src: "/images/landing/feature-1.png", alt: "Creator mit InfluexAI" },
  {
    type: "video",
    src: "/videos/landing/feature-1.mp4",
    poster: "/images/landing/feature-1.png",
  },
];

const HERO_MEDIA_CROSSFADE_MS = 800;
const HERO_IMAGE_DURATION_MS = 6000;

const HERO_IMAGE_INDEX = HERO_MEDIA_ITEMS.findIndex((item) => item.type === "image");
const HERO_VIDEO_INDEX = HERO_MEDIA_ITEMS.findIndex((item) => item.type === "video");
const HERO_HAS_VIDEO_CYCLE =
  HERO_IMAGE_INDEX >= 0 && HERO_VIDEO_INDEX >= 0 && HERO_IMAGE_INDEX !== HERO_VIDEO_INDEX;

function HeroBackgroundMedia() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(
    HERO_IMAGE_INDEX >= 0 ? HERO_IMAGE_INDEX : 0
  );
  useParallax(ref, 0.04, 1.02);

  const clearImageTimer = () => {
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!HERO_HAS_VIDEO_CYCLE || activeIndex !== HERO_IMAGE_INDEX) {
      clearImageTimer();
      return;
    }

    clearImageTimer();
    imageTimerRef.current = setTimeout(() => {
      setActiveIndex(HERO_VIDEO_INDEX);
    }, HERO_IMAGE_DURATION_MS);

    return clearImageTimer;
  }, [activeIndex]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || HERO_VIDEO_INDEX < 0) return;

    if (activeIndex === HERO_VIDEO_INDEX) {
      el.currentTime = 0;
      void el.play().catch(() => {});
      return;
    }

    el.pause();
  }, [activeIndex]);

  const handleVideoEnded = () => {
    if (HERO_IMAGE_INDEX >= 0) {
      setActiveIndex(HERO_IMAGE_INDEX);
    }
  };

  return (
    <div
      className="pointer-events-none absolute z-[1]"
      style={{
        top: "50%",
        right: "clamp(0%, 1vw, 4%)",
        width: "clamp(300px, 46vw, 580px)",
        height: "clamp(340px, 58vh, 640px)",
        transform: "translateY(-50%)",
      }}
      aria-hidden
    >
      <div
        ref={ref}
        className="relative h-full w-full overflow-hidden"
        style={{
          opacity: 0.72,
          maskImage:
            "radial-gradient(ellipse 92% 84% at 58% 50%, #000 38%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 92% 84% at 58% 50%, #000 38%, transparent 78%)",
        }}
      >
        {HERO_MEDIA_ITEMS.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={item.type === "image" ? item.src : item.src}
              className="absolute inset-0 transition-opacity ease-in-out"
              style={{
                opacity: isActive ? 1 : 0,
                transitionDuration: `${HERO_MEDIA_CROSSFADE_MS}ms`,
                zIndex: isActive ? 1 : 0,
              }}
            >
              {item.type === "image" ? (
                <Image
                  src={item.src}
                  alt=""
                  fill
                  className="object-cover object-center"
                  style={{ filter: "brightness(1.04) saturate(1.08)" }}
                  priority={index === 0}
                  sizes="(min-width: 768px) 40vw, 70vw"
                />
              ) : (
                <video
                  ref={(el) => {
                    videoRef.current = el;
                  }}
                  src={item.src}
                  poster={item.poster}
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleVideoEnded}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  style={{ filter: "brightness(1.04) saturate(1.08)" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HeroSection({ variant = "a" }: { variant?: AbVariant }) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);
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
      className="relative min-h-[min(100vh,920px)] overflow-hidden"
    >
      {/* Base grid + interactive reveal */}
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
        <div
          className="absolute inset-0 z-[1] md:hidden"
          style={{
            backgroundImage: `
              linear-gradient(rgba(180,255,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(180,255,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <GridReveal />
      </div>

      {/* Subtle hero media — background, no frame */}
      <HeroBackgroundMedia />

      {/* Vignettes — blend media into Acid Noir */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 95% 90% at 76% 48%, rgba(180,255,0,0.07) 0%, transparent 58%), linear-gradient(to right, #060608 0%, rgba(6,6,8,0.45) 36%, rgba(6,6,8,0.08) 62%, rgba(6,6,8,0.22) 100%), linear-gradient(to top, rgba(6,6,8,0.55) 0%, transparent 28%)",
        }}
        aria-hidden
      />

      {/* Copy */}
      <div
        className="relative z-10 mx-auto flex min-h-[min(100vh,920px)] max-w-[1160px] flex-col justify-center"
        style={{
          padding:
            "clamp(48px,7vw,88px) clamp(20px,6vw,64px) clamp(56px,8vw,96px)",
          transform: `translateY(${scrollY * 0.04}px)`,
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
          <p className="hero-subtitle mb-8 max-w-[520px]">
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
              → {t("cta_primary", priceParams)}
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
    </section>
  );
}
