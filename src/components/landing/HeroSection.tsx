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
const HERO_COLOR_FLASH_MS = 600;

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

function HeroBackgroundMedia() {
  const videoRef1 = useRef<HTMLVideoElement | null>(null);
  const videoRef2 = useRef<HTMLVideoElement | null>(null);
  const colorFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(HERO_IMAGE_INDEX);
  const [imageGeneration, setImageGeneration] = useState(0);
  const [colorFlash, setColorFlash] = useState(false);

  const clearColorFlashTimer = () => {
    if (colorFlashTimerRef.current) {
      clearTimeout(colorFlashTimerRef.current);
      colorFlashTimerRef.current = null;
    }
  };

  const triggerColorFlash = () => {
    clearColorFlashTimer();
    setColorFlash(true);
    colorFlashTimerRef.current = setTimeout(() => {
      setColorFlash(false);
      colorFlashTimerRef.current = null;
    }, HERO_COLOR_FLASH_MS);
  };

  useEffect(() => {
    if (activeIndex === HERO_IMAGE_INDEX) {
      setImageGeneration((g) => g + 1);
    }
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex !== HERO_IMAGE_INDEX) return;

    const id = setTimeout(() => {
      setActiveIndex(HERO_VIDEO_1_INDEX);
    }, HERO_IMAGE_DURATION_MS);

    return () => clearTimeout(id);
  }, [activeIndex]);

  useEffect(() => {
    const v1 = videoRef1.current;
    const v2 = videoRef2.current;
    if (v1) void v1.load();
    if (v2) void v2.load();
  }, []);

  useEffect(() => {
    const v1 = videoRef1.current;
    const v2 = videoRef2.current;

    if (activeIndex === HERO_VIDEO_1_INDEX && v1) {
      if (v1.paused) {
        v1.currentTime = 0;
        void v1.play().catch(() => {});
      }
      v2?.pause();
    } else if (activeIndex === HERO_VIDEO_2_INDEX && v2) {
      if (v2.paused) {
        v2.currentTime = 0;
        void v2.play().catch(() => {});
      }
      v1?.pause();
    } else {
      v1?.pause();
      v2?.pause();
    }
  }, [activeIndex]);

  useEffect(() => {
    return () => {
      clearColorFlashTimer();
    };
  }, []);

  const handleVideo1Ended = () => {
    triggerColorFlash();
    const v2 = videoRef2.current;
    if (v2) {
      v2.currentTime = 0;
      void v2.play().catch(() => {});
    }
    setActiveIndex(HERO_VIDEO_2_INDEX);
  };

  const handleVideo2Ended = () => {
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
                  key={`hero-img-${imageGeneration}`}
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

      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{
          background: "#B4FF00",
          opacity: colorFlash ? 0.7 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
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
      className="relative min-h-[min(100vh,920px)] overflow-visible"
    >
      {/* Base grid + interactive reveal */}
      <div
        className="absolute inset-0 z-0 overflow-visible pointer-events-none"
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
