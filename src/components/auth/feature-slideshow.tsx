"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AuthFloatingPreview } from "@/components/auth/auth-floating-preview";

function ScriptVisual() {
  return (
    <div className="auth-canvas-asset-node p-5 max-w-sm">
      <div className="auth-canvas-asset-shine" aria-hidden />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="auth-badge auth-badge--hook">HOOK</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">
              Script · Asset
            </span>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#ccff00]/80 shadow-[0_0_8px_#ccff00]" />
        </div>
        <p className="mb-4 text-sm font-semibold text-white/90">
          Morning Routine Script
        </p>
        <div className="mb-4 space-y-2">
          <div className="h-2 w-3/4 rounded-full bg-[#ccff00]/45" />
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="h-2 w-5/6 rounded-full bg-white/10" />
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span className="auth-badge auth-badge--main">MAIN</span>
        </div>
        <div className="mb-4 space-y-2">
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="h-2 w-4/5 rounded-full bg-white/10" />
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="h-2 w-3/4 rounded-full bg-white/10" />
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span className="auth-badge auth-badge--cta">CTA</span>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-2/3 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function NicheVisual() {
  const items = [
    {
      name: "Fitness Biohacking",
      competition: "Niedrig",
      stars: 5,
      color: "text-green-400 bg-green-500/15 border-green-500/25",
    },
    {
      name: "Budget Meal Prep",
      competition: "Mittel",
      stars: 4,
      color: "text-amber-400 bg-amber-500/15 border-amber-500/25",
    },
    {
      name: "AI Productivity",
      competition: "Niedrig",
      stars: 5,
      color: "text-green-400 bg-green-500/15 border-green-500/25",
    },
  ];
  return (
    <div className="auth-canvas-asset-node max-w-sm space-y-2.5 p-4">
      <div className="auth-canvas-asset-shine" aria-hidden />
      <div className="relative space-y-2.5">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-xl border border-zinc-800/50 bg-black/30 px-4 py-3"
          >
            <span className="text-sm font-medium text-white">{item.name}</span>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${item.color}`}
              >
                {item.competition}
              </span>
              <span className="text-xs text-[#ccff00]">
                {"⭐".repeat(item.stars)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutlierVisual() {
  const tags = [
    "Curiosity Gap Hook",
    "Contrarian Angle",
    "List Format (viral)",
  ];
  return (
    <div className="auth-canvas-asset-node max-w-sm p-5">
      <div className="auth-canvas-asset-shine" aria-hidden />
      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">
              &quot;5 Fehler die 99% machen&quot;
            </p>
            <p className="mt-1 text-xs text-white/50">Fitness · Micro Channel</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#ccff00]">9.2</p>
            <p className="text-xs text-white/50">/ 10</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {tags.map((tag) => (
            <div key={tag} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ccff00] shadow-[0_0_6px_#ccff00]" />
              <span className="text-xs text-white/75">{tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThumbnailVisual() {
  return (
    <div className="auth-canvas-asset-node max-w-sm space-y-3 p-4">
      <div className="auth-canvas-asset-shine" aria-hidden />
      <div className="relative space-y-3">
        <div
          className="relative aspect-video overflow-hidden rounded-xl border border-zinc-800/50"
          style={{
            background: "linear-gradient(135deg, #0a0a0f 0%, #12121a 100%)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-between px-6">
            <div className="space-y-2">
              <div className="h-6 w-32 rounded bg-[#ccff00] opacity-90 shadow-[0_0_16px_rgba(204,255,0,0.35)]" />
              <div className="h-4 w-24 rounded bg-white/80" />
              <div className="h-3 w-20 rounded bg-white/40" />
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#ccff00]/45 bg-white/5">
              <span className="text-2xl">😱</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-6 rounded bg-[#ccff00]" />
          <div className="h-4 w-6 rounded bg-blue-500" />
          <div className="h-4 w-6 rounded bg-white" />
          <span className="ml-1 text-xs text-white/50">Farbpalette</span>
        </div>
      </div>
    </div>
  );
}

function KiIchVisual() {
  const t = useTranslations("slideshow");
  const benefits = [
    t("ki_ich_benefit_1"),
    t("ki_ich_benefit_2"),
    t("ki_ich_benefit_3"),
  ];
  return (
    <div className="auth-canvas-asset-node max-w-sm p-5">
      <div className="auth-canvas-asset-shine" aria-hidden />
      <div className="relative">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-[#ccff00]/35 bg-black/40">
            <span className="text-xl">📷</span>
          </div>
          <div>
            <div className="mb-1 h-4 w-28 rounded bg-white/80" />
            <div className="h-3 w-20 rounded bg-white/35" />
          </div>
        </div>
        <div className="space-y-3">
          {benefits.map((text) => (
            <div key={text} className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ccff00]" />
              <span className="text-sm text-white/75">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SLIDE_VISUALS = [
  ScriptVisual,
  NicheVisual,
  OutlierVisual,
  ThumbnailVisual,
  KiIchVisual,
] as const;

export function FeatureSlideshow() {
  const t = useTranslations("slideshow");
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const slides = [1, 2, 3, 4, 5].map((n, i) => ({
    badge: t(`slide${n}_badge`),
    heading: t(`slide${n}_heading`),
    description: t(`slide${n}_description`),
    Visual: SLIDE_VISUALS[i],
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setFading(false);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (index: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 300);
  };

  const slide = slides[current];
  const Visual = slide.Visual;

  return (
    <div className="auth-canvas-teaser relative flex h-full flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/55 via-black/35 to-black/60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(204,255,0,0.06) 0%, transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col px-8 py-8 xl:px-10">
        <div className="mb-auto pt-4 font-[family-name:var(--font-bebas)] text-xl font-bold tracking-wide text-[#ccff00]">
          InfluexAI
        </div>

        <div
          className={`flex flex-1 flex-col justify-center transition-all duration-300 ${
            fading ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          <p className="mb-2 text-sm uppercase tracking-widest text-white/50">
            {slide.badge}
          </p>
          <h2 className="mb-3 max-w-md text-3xl font-semibold leading-tight text-white">
            {slide.heading}
          </h2>
          <p className="mb-8 max-w-md text-base leading-relaxed text-white/70">
            {slide.description}
          </p>
          <AuthFloatingPreview>
            <Visual />
          </AuthFloatingPreview>
        </div>

        <div className="flex items-center gap-2 pb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-[#ccff00] shadow-[0_0_10px_rgba(204,255,0,0.45)]"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <p className="pb-2 text-center text-xs text-white/25">
          {t("social_proof")}
        </p>
      </div>
    </div>
  );
}
