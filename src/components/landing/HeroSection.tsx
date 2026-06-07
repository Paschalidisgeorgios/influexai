"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import type { AbVariant } from "@/lib/ab-tracking";
import { getStarterPriceParams } from "@/lib/pricing";
import { HeroTitle } from "@/components/landing/HeroTitle";
import { AgentPreviewDemo } from "@/components/landing/AgentPreviewDemo";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";

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
  {
    type: "video",
    src: "/videos/landing/feature-2.mp4",
    poster: "/images/landing/feature-1.png",
  },
];

const HERO_MEDIA_CROSSFADE_MS = 800;
const HERO_IMAGE_DURATION_MS = 6000;

const HERO_IMAGE_INDEX = 0;
const HERO_VIDEO_1_INDEX = 1;
const HERO_VIDEO_2_INDEX = 2;

const HERO_MEDIA_MASK_HORIZONTAL =
  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 8%, rgba(0,0,0,0.8) 20%, black 32%, black 100%)";
const HERO_MEDIA_MASK_VERTICAL =
  "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)";
const HERO_MEDIA_MASK_IMAGE = [
  HERO_MEDIA_MASK_HORIZONTAL,
  HERO_MEDIA_MASK_VERTICAL,
].join(", ");

const HERO_MEDIA_MASK_STYLE = {
  WebkitMaskImage: HERO_MEDIA_MASK_IMAGE,
  WebkitMaskComposite: "source-in",
  maskImage: HERO_MEDIA_MASK_IMAGE,
  maskComposite: "intersect",
} as const;

const HERO_MEDIA_MASK_WRAPPER_STYLE = {
  position: "absolute" as const,
  inset: 0,
  width: "100%",
  height: "100%",
  overflow: "hidden" as const,
  ...HERO_MEDIA_MASK_STYLE,
};

const HERO_MEDIA_FRAME_STYLE = {
  border: "none",
  outline: "none",
  boxShadow: "none",
  borderRadius: 0,
} as const;

const HERO_MEDIA_CONTAINER_STYLE = {
  ...HERO_MEDIA_FRAME_STYLE,
  position: "absolute" as const,
  top: 0,
  right: "-6vw",
  bottom: 0,
  width: "clamp(320px, 62vw, 900px)",
  height: "100%",
  overflow: "hidden" as const,
  pointerEvents: "none" as const,
  zIndex: 3,
};

const HERO_MEDIA_LAYER_STYLE = {
  ...HERO_MEDIA_FRAME_STYLE,
  width: "100%",
  height: "100%",
};

const HERO_MEDIA_OBJECT_STYLE = {
  display: "block" as const,
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
  objectPosition: "center top",
};

const HERO_MEDIA_FILTER = "brightness(1.04) saturate(1.08)";

function prepVideoAtStart(video: HTMLVideoElement) {
  video.pause();
  video.currentTime = 0;
  video.addEventListener("seeked", () => {}, { once: true });
}

function HeroBackgroundMedia() {
  const videoRef1 = useRef<HTMLVideoElement | null>(null);
  const videoRef2 = useRef<HTMLVideoElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(HERO_IMAGE_INDEX);
  const [imageCycle, setImageCycle] = useState(0);

  useEffect(() => {
    if (activeIndex !== HERO_IMAGE_INDEX) return;

    const id = setTimeout(() => {
      setActiveIndex((prev) =>
        prev === HERO_IMAGE_INDEX ? HERO_VIDEO_1_INDEX : prev
      );
    }, HERO_IMAGE_DURATION_MS);

    return () => clearTimeout(id);
  }, [activeIndex]);

  useEffect(() => {
    if (videoRef1.current) {
      videoRef1.current.load();
    }
    if (videoRef2.current) {
      videoRef2.current.load();
    }
  }, []);

  useEffect(() => {
    const v1 = videoRef1.current;
    const v2 = videoRef2.current;

    if (activeIndex === HERO_VIDEO_1_INDEX && v1) {
      void v1.play().catch(() => {});
      v2?.pause();
    } else if (activeIndex === HERO_VIDEO_2_INDEX && v2) {
      v2.currentTime = 0;
      void v2.play().catch(() => {});
      if (v1) {
        prepVideoAtStart(v1);
      }
    } else if (activeIndex === HERO_IMAGE_INDEX) {
      v2?.pause();
      if (v1) {
        prepVideoAtStart(v1);
      }
    }
  }, [activeIndex]);

  const handleVideo1Ended = () => {
    setActiveIndex(HERO_VIDEO_2_INDEX);
  };

  const handleVideo2Ended = () => {
    setImageCycle((c) => c + 1);
    setActiveIndex(HERO_IMAGE_INDEX);
  };

  return (
    <div
      className="hidden md:block"
      style={HERO_MEDIA_CONTAINER_STYLE}
      aria-hidden
    >
      <div className="relative" style={HERO_MEDIA_LAYER_STYLE}>
        {HERO_MEDIA_ITEMS.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={`${item.type}-${index}-${item.src}`}
              className="absolute inset-0 transition-opacity ease-in-out"
              style={{
                opacity: isActive ? 1 : 0,
                transitionDuration: `${HERO_MEDIA_CROSSFADE_MS}ms`,
                zIndex: isActive ? 1 : 0,
                willChange: "opacity",
                ...HERO_MEDIA_LAYER_STYLE,
              }}
            >
              {item.type === "image" ? (
                <div
                  key={`hero-img-${imageCycle}`}
                  className="hero-ken-burns absolute inset-0"
                  style={HERO_MEDIA_LAYER_STYLE}
                >
                  <div
                    style={{
                      ...HERO_MEDIA_MASK_WRAPPER_STYLE,
                      ...HERO_MEDIA_FRAME_STYLE,
                    }}
                  >
                    <Image
                      src={item.src}
                      alt=""
                      fill
                      className="object-cover object-top"
                      style={{ filter: HERO_MEDIA_FILTER }}
                      priority={index === 0}
                      sizes="62vw"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    ...HERO_MEDIA_MASK_WRAPPER_STYLE,
                    ...HERO_MEDIA_FRAME_STYLE,
                  }}
                >
                  <video
                    ref={index === HERO_VIDEO_1_INDEX ? videoRef1 : videoRef2}
                    src={item.src}
                    poster={item.poster}
                    muted
                    playsInline
                    preload="auto"
                    onEnded={
                      index === HERO_VIDEO_1_INDEX
                        ? handleVideo1Ended
                        : handleVideo2Ended
                    }
                    style={{
                      filter: HERO_MEDIA_FILTER,
                      ...HERO_MEDIA_OBJECT_STYLE,
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      willChange: "opacity",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HeroSection({
  variant: _variant = "a",
}: {
  variant?: AbVariant;
} = {}) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);
  const [audience, setAudience] = useState<Audience>("creator");
  const [parallaxY, setParallaxY] = useState(0);
  const [revealed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const rawRotating = t.raw("rotating_titles");
  const rotatingTitles = Array.isArray(rawRotating)
    ? (rawRotating as string[])
    : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setParallaxY(window.scrollY * 0.04);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="landing-hero-sentinel"
      className="relative min-h-[min(100vh,920px)] overflow-x-clip max-w-[100vw]"
    >
      {/* Mobile: dezentes Hintergrundbild (CSS, kein Video) */}
      <div
        className="absolute inset-0 z-[2] md:hidden pointer-events-none overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/images/landing/feature-1.png')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            opacity: 0.15,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(6,6,8,0.55) 0%, rgba(6,6,8,0.92) 100%)",
          }}
        />
      </div>
      {/* Base grid + interactive reveal */}
      <div
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none md:overflow-visible"
        aria-hidden
      >
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

      <HeroBackgroundMedia />

      <div
        className={`hero-copy relative z-10 mx-auto w-full max-w-7xl ${
          revealed ? "hero-copy-revealed" : "hero-copy-hidden"
        }`}
        style={
          mounted && revealed
            ? ({ ["--hero-parallax" as string]: `${parallaxY}px` } as React.CSSProperties)
            : undefined
        }
      >
        <div className="grid min-h-[min(100vh,920px)] w-full grid-cols-1 items-center gap-10 overflow-x-hidden lg:grid-cols-[minmax(0,1fr)_minmax(420px,540px)] lg:gap-14">
          {/* Left: Badge, Toggle, Headline, Subline, CTAs, Trust */}
          <div className="flex min-w-0 max-w-[680px] flex-col gap-6 lg:gap-7">
            <SpringReveal>
              <div className="flex items-center gap-2.5">
                <div
                  className="h-[7px] w-[7px] shrink-0 animate-blink rounded-full bg-[var(--accent,#B4FF00)]"
                  aria-hidden
                />
                <span className="kicker">{t("badge")} · 2026</span>
              </div>
            </SpringReveal>

            <SpringReveal delay={0.08}>
              <div className="flex flex-wrap items-center gap-2">
                {(["creator", "brand"] as Audience[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAudience(a)}
                    className="min-h-[44px] cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200"
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
              <p className="hero-subtitle w-full max-w-[520px]">
                {audience === "creator" ? t("creator_subtitle") : t("brand_subtitle")}
              </p>
            </SpringReveal>

            <SpringReveal delay={0.4}>
              <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <AcidMotionButton
                  href="/auth/sign-up"
                  className="btn-acid w-full justify-center sm:w-auto sm:justify-start"
                >
                  → {t("cta_primary", priceParams)}
                </AcidMotionButton>
                <a
                  href="#features"
                  className="btn-ghost w-full justify-center sm:w-auto sm:justify-start"
                >
                  {t("cta_secondary")}
                </a>
              </div>
            </SpringReveal>

            <SpringReveal delay={0.24}>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)" }}>
                {t("trust_line", priceParams)}
              </p>
            </SpringReveal>

            <div className="block lg:hidden">
              <AgentPreviewDemo compact />
            </div>
          </div>

          {/* Right: Agent Preview (desktop) */}
          <div className="relative hidden w-full items-center justify-end lg:flex">
            <SpringReveal delay={0.2} className="w-full max-w-[520px]">
              <AgentPreviewDemo />
            </SpringReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
