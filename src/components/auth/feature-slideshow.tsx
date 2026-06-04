"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function ScriptVisual() {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5 max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs bg-[#B4FF00]/20 text-[#B4FF00] px-2 py-1 rounded-full font-medium">
          HOOK
        </span>
        <span className="text-white/40 text-xs">Morning Routine Script</span>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-2 bg-[#B4FF00]/40 rounded-full w-3/4" />
        <div className="h-2 bg-white/10 rounded-full w-full" />
        <div className="h-2 bg-white/10 rounded-full w-5/6" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded-full">
          MAIN
        </span>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-2 bg-white/10 rounded-full w-full" />
        <div className="h-2 bg-white/10 rounded-full w-4/5" />
        <div className="h-2 bg-white/10 rounded-full w-full" />
        <div className="h-2 bg-white/10 rounded-full w-3/4" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
          CTA
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-white/10 rounded-full w-2/3" />
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
      color: "text-green-400 bg-green-500/20",
    },
    {
      name: "Budget Meal Prep",
      competition: "Mittel",
      stars: 4,
      color: "text-amber-400 bg-amber-500/20",
    },
    {
      name: "AI Productivity",
      competition: "Niedrig",
      stars: 5,
      color: "text-green-400 bg-green-500/20",
    },
  ];
  return (
    <div className="space-y-3 max-w-sm">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10"
        >
          <span className="text-white text-sm font-medium">{item.name}</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${item.color}`}
            >
              {item.competition}
            </span>
            <span className="text-[#B4FF00] text-xs">
              {"⭐".repeat(item.stars)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OutlierVisual() {
  const tags = ["Curiosity Gap Hook", "Contrarian Angle", "List Format (viral)"];
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-5 max-w-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-white font-medium text-sm">
            &quot;5 Fehler die 99% machen&quot;
          </p>
          <p className="text-white/40 text-xs mt-1">Fitness · Micro Channel</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[#B4FF00]">9.2</p>
          <p className="text-white/40 text-xs">/ 10</p>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        {tags.map((tag) => (
          <div key={tag} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#B4FF00] flex-shrink-0" />
            <span className="text-white/60 text-xs">{tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThumbnailVisual() {
  return (
    <div className="max-w-sm space-y-3">
      <div
        className="aspect-video rounded-xl overflow-hidden relative border border-white/10"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-between px-6">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-[#B4FF00] rounded opacity-90" />
            <div className="h-4 w-24 bg-white/80 rounded" />
            <div className="h-3 w-20 bg-white/40 rounded" />
          </div>
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-[#B4FF00]/50 flex items-center justify-center">
            <span className="text-2xl">😱</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="h-4 w-6 rounded bg-[#B4FF00]" />
        <div className="h-4 w-6 rounded bg-blue-500" />
        <div className="h-4 w-6 rounded bg-white" />
        <span className="text-white/40 text-xs ml-1">Farbpalette</span>
      </div>
    </div>
  );
}

function CommunityVisual() {
  const items = [
    {
      initials: "MT",
      name: "Markus T.",
      niche: "Fitness",
      text: "Erstes KI-Script → 47K Views 🏆",
      metric: "47K Views",
    },
    {
      initials: "SK",
      name: "Sarah K.",
      niche: "Finance",
      text: "Niche Analyzer hat alles verändert",
      metric: "3× mehr Views",
    },
    {
      initials: "JM",
      name: "Jonas M.",
      niche: "Tech",
      text: "Jeden Montag 5 neue Video-Ideen",
      metric: "5 Ideen/Woche",
    },
  ];
  return (
    <div className="space-y-3 max-w-sm">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10"
        >
          <div className="w-8 h-8 rounded-full bg-[#B4FF00] flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
            {item.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-medium">{item.name}</span>
              <span className="text-white/30 text-xs">{item.niche}</span>
            </div>
            <p className="text-white/60 text-xs mt-0.5">{item.text}</p>
          </div>
          <span className="text-[#B4FF00] text-xs font-medium flex-shrink-0">
            {item.metric}
          </span>
        </div>
      ))}
    </div>
  );
}

const SLIDE_VISUALS = [
  ScriptVisual,
  NicheVisual,
  OutlierVisual,
  ThumbnailVisual,
  CommunityVisual,
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
    <div className="flex flex-col h-full px-10 py-8">
      <div className="text-[#B4FF00] font-bold text-xl mb-auto pt-4 font-[family-name:var(--font-bebas)] tracking-wide">
        InfluexAI
      </div>

      <div
        className={`flex-1 flex flex-col justify-center transition-all duration-300 ${
          fading ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
        }`}
      >
        <p className="text-white/40 text-sm mb-2 uppercase tracking-widest">
          {slide.badge}
        </p>
        <h2 className="text-white text-3xl font-semibold mb-3 leading-tight">
          {slide.heading}
        </h2>
        <p className="text-white/50 text-base mb-8 leading-relaxed max-w-md">
          {slide.description}
        </p>
        <Visual />
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
                ? "bg-[#B4FF00] w-6"
                : "bg-white/20 w-2 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      <p className="text-white/25 text-xs text-center pb-2">
        {t("social_proof")}
      </p>
    </div>
  );
}
