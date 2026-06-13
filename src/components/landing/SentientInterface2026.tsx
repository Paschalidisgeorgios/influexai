"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { IntentLink, useCardDwell, type IntentKey } from "@/hooks/useIntentTracking";
import {
  Video,
  LayoutGrid,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react";
import { LANDING_BENTO_ACCENT_RGB, LANDING_NEON } from "@/lib/landing-neon-theme";
import { LandingFeatureVideo } from "@/components/landing/LandingFeatureVideo";
import { LandingLiveDemoPlayground } from "@/components/landing/LandingLiveDemoPlayground";
import {
  LANDING_FEATURE_CARDS_2026,
  LANDING_STUDIO_SECTION_2026,
  type LandingCopySegment,
  type LandingFeatureCardCopy,
} from "@/lib/landing-copy-2026";

const TOOL_CHIPS = ["Claude Script", "B-Roll Match", "Seedance", "Viral Score"];

const CARD_ICONS: Record<string, React.ReactNode> = {
  "infinite-canvas": <LayoutGrid size={20} />,
  "seedance-kling": <Video size={20} />,
  "avatar-studio": <Layers size={20} />,
  "viral-predictor": <TrendingUp size={20} />,
};

function bentoAccentStyle(accent: LandingFeatureCardCopy["accent"]): CSSProperties {
  return { "--bento-accent-rgb": LANDING_BENTO_ACCENT_RGB[accent] } as CSSProperties;
}

function CopySegments({ segments }: { segments: LandingCopySegment[] }) {
  return (
    <p
      className="text-[13px] leading-relaxed text-white/55"
      style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
    >
      {segments.map((segment, index) =>
        segment.highlight ? (
          <span key={index} className="font-medium text-[#ccff00]">
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </p>
  );
}

function HeroPreview() {
  return (
    <div className="landing-glass-node relative mx-auto mt-14 w-full max-w-4xl overflow-hidden transition-all duration-300">
      <span className="landing-glass-node-shine" aria-hidden />
      <span className="landing-glass-node-handle landing-glass-node-handle--left" aria-hidden />
      <span className="landing-glass-node-handle landing-glass-node-handle--right" aria-hidden />
      <div className="brightness-110 contrast-105 saturate-110">
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex items-center gap-4">
          {(["APP_STUDIO", "FPS: 60", "NODES: 12"] as const).map((stat) => (
            <span key={stat} className="font-mono text-[9px] tracking-wider text-white/25">
              {stat}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: LANDING_NEON.green }}
          />
          <span className="font-mono text-[9px]" style={{ color: `${LANDING_NEON.green}B3` }}>
            LIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        <div
          className="border-b p-5 md:border-b-0 md:border-r"
          style={{ borderColor: "var(--border-soft)" }}
        >
          <p className="mb-3 font-mono text-[10px] tracking-widest text-white/50 uppercase">
            Claude · Skript + B-Roll
          </p>
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border-soft)", background: LANDING_NEON.bgPrimary }}
          >
            <p className="font-mono text-sm leading-relaxed text-white/70">
              <span style={{ color: LANDING_NEON.green }}>→</span> Virales Café-Reel: Hook, 3
              Body-Segmente, CTA — inkl.{" "}
              <span className="text-[#ccff00]">Flux/Kling B-Roll-Prompts</span>
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{ width: "86%", background: LANDING_NEON.green }}
                />
              </div>
              <span className="font-mono text-[9px] text-white/50">86%</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {TOOL_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 font-mono text-[10px] text-white/50"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5">
          <p className="mb-3 font-mono text-[10px] tracking-widest text-white/50 uppercase">
            Canvas Pipeline
          </p>
          <div className="space-y-2">
            {[
              { label: "Claude Premium-Skript", done: true },
              { label: "Viral-Predictor: +24 Score", done: true },
              { label: "B-Roll-Kacheln gespawnt", done: true },
              { label: "Seedance-Render bereit", done: false },
            ].map(({ label, done }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]"
                  style={
                    done
                      ? {
                          background: `rgba(${LANDING_NEON.greenRgb}, 0.15)`,
                          color: LANDING_NEON.green,
                        }
                      : { border: "1px solid rgba(255,255,255,0.1)", color: "transparent" }
                  }
                >
                  {done ? "✓" : ""}
                </span>
                <span className={`text-xs ${done ? "text-white/80" : "text-white/55"}`}>
                  {label}
                </span>
                {!done && (
                  <div className="ml-auto flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1 w-1 animate-bounce rounded-full"
                        style={{
                          background: `rgba(${LANDING_NEON.blueRgb}, 0.6)`,
                          animationDelay: `${i * 150}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div
            className="mt-4 rounded-xl border p-3"
            style={{
              borderColor: `rgba(${LANDING_NEON.cyanRgb}, 0.2)`,
              background: `rgba(${LANDING_NEON.greenRgb}, 0.05)`,
            }}
          >
            <p className="font-mono text-[9px]" style={{ color: `${LANDING_NEON.cyan}CC` }}>
              CTR-Tendenz: <span className="text-[#ccff00]">+14%</span> · Viral Score 91 · Demo
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function BentoCardItem({
  card,
  className = "",
}: {
  card: LandingFeatureCardCopy;
  className?: string;
}) {
  const { ref, startDwell, cancelDwell } = useCardDwell(card.intentKey);
  const icon = CARD_ICONS[card.id] ?? <Sparkles size={20} />;

  return (
    <div
      ref={ref}
      onPointerEnter={() => startDwell(card.intentKey)}
      onPointerLeave={() => cancelDwell(card.intentKey)}
      className={`landing-neon-bento-card landing-glass-node group relative flex flex-col gap-4 p-6 ${className}`}
      style={bentoAccentStyle(card.accent)}
    >
      <span className="landing-glass-node-shine" aria-hidden />
      <span className="landing-glass-node-handle landing-glass-node-handle--left" aria-hidden />
      <span className="landing-glass-node-handle landing-glass-node-handle--right" aria-hidden />

      {card.videoSrc ? (
        <LandingFeatureVideo
          src={card.videoSrc}
          label={card.title}
          className="-mx-1 mb-1 w-[calc(100%+0.5rem)]"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="landing-neon-bento-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          {icon}
        </div>
        <span className="landing-neon-bento-tag rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wide">
          {card.tag}
        </span>
      </div>
      <div>
        <h3 className="landing-glass-heading mb-2 text-[15px] tracking-tight text-white">
          {card.title}
        </h3>
        <CopySegments segments={card.segments} />
      </div>
      <ChevronRight
        size={14}
        className="mt-auto self-end text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-[#ccff00]/70"
        aria-hidden="true"
      />
    </div>
  );
}

export default function SentientInterface2026() {
  const [badgeIndex, setBadgeIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const statusMessages = LANDING_STUDIO_SECTION_2026.statusMessages;

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setBadgeIndex((prev) => (prev + 1) % statusMessages.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [statusMessages.length]);

  const statusMessage = statusMessages[badgeIndex];

  return (
    <section id="studio-showcase" className="relative overflow-x-hidden bg-transparent text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="landing-glass-dot-grid absolute inset-0 opacity-50" />
        <div className="landing-hero-content-glow landing-hero-content-glow--green left-1/2 top-[42%] -translate-x-1/2 blur-[120px]" />
        <div className="landing-hero-content-glow landing-hero-content-glow--cyan-violet left-1/2 top-[48%] -translate-x-1/3 blur-[120px]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 42%, rgba(3,3,4,0.65) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 px-6 pt-20 pb-16 text-center md:px-12 md:pt-28">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] text-white/50 backdrop-blur-sm"
          style={{
            borderColor: `rgba(${LANDING_NEON.violetRgb}, 0.25)`,
            background: `rgba(${LANDING_NEON.violetRgb}, 0.06)`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: LANDING_NEON.cyan }}
            aria-hidden="true"
          />
          {statusMessage}
        </div>

        <h2 className="landing-glass-heading mx-auto max-w-3xl text-[clamp(2rem,5.5vw,4.25rem)] leading-[1.06] text-white">
          {LANDING_STUDIO_SECTION_2026.headline}{" "}
          <span className="text-[#ccff00]">{LANDING_STUDIO_SECTION_2026.headlineAccent}</span>
        </h2>

        <p
          className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/60"
          style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
        >
          {LANDING_STUDIO_SECTION_2026.subline}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <IntentLink href="/signup" className="landing-glass-btn-cta">
            App Studio öffnen <ArrowRight size={15} aria-hidden="true" />
          </IntentLink>
        </div>

        <HeroPreview />
      </div>

      <div id="bento-features" className="relative z-10 px-6 pb-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="landing-neon-divider-glow mb-12" aria-hidden />
          <div className="mb-10 text-center">
            <p className="landing-neon-section-kicker landing-neon-section-kicker--blue mb-2 font-mono text-[10px] tracking-[0.14em]">
              {LANDING_STUDIO_SECTION_2026.featuresKicker}
            </p>
            <h2 className="landing-glass-heading text-[clamp(1.75rem,3.5vw,2.75rem)] text-white">
              {LANDING_STUDIO_SECTION_2026.featuresTitle}
            </h2>
            <p
              className="mx-auto mt-3 max-w-lg text-[14px] leading-relaxed text-white/60"
              style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
            >
              {LANDING_STUDIO_SECTION_2026.featuresSubline}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
            <BentoCardItem card={LANDING_FEATURE_CARDS_2026[0]} className="lg:col-start-1 lg:row-start-1" />
            <LandingLiveDemoPlayground className="sm:col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:row-span-2" />
            <BentoCardItem card={LANDING_FEATURE_CARDS_2026[1]} className="lg:col-start-3 lg:row-start-1" />
            <BentoCardItem card={LANDING_FEATURE_CARDS_2026[2]} className="lg:col-start-1 lg:row-start-2" />
            <BentoCardItem card={LANDING_FEATURE_CARDS_2026[3]} className="lg:col-start-3 lg:row-start-2" />
          </div>
        </div>
      </div>
    </section>
  );
}
