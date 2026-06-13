"use client";

import { Building2, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { useCardDwell, type IntentKey } from "@/hooks/useIntentTracking";
import { LANDING_ACCENT_RGB, type LandingNeonAccent } from "@/lib/landing-neon-theme";
import type { CSSProperties } from "react";

import { LANDING_DEMO_VIDEOS } from "@/lib/landing-demo-videos";
import { LandingFeatureVideo } from "@/components/landing/LandingFeatureVideo";

const USE_CASES = [
  {
    key: "creator",
    icon: Zap,
    accent: "green" as LandingNeonAccent,
    intentKey: "visuals" as IntentKey,
    videoSrc: LANDING_DEMO_VIDEOS.kiInfluencer,
  },
  {
    key: "brand",
    icon: Building2,
    accent: "blue" as LandingNeonAccent,
    intentKey: "werbung" as IntentKey,
    videoSrc: LANDING_DEMO_VIDEOS.loraTraining,
  },
  {
    key: "influencer",
    icon: Sparkles,
    accent: "violet" as LandingNeonAccent,
    intentKey: "avatar-live" as IntentKey,
    videoSrc: LANDING_DEMO_VIDEOS.kiAvatar,
  },
] as const;

function accentStyle(accent: LandingNeonAccent): CSSProperties {
  return { "--section-accent-rgb": LANDING_ACCENT_RGB[accent] } as CSSProperties;
}

function UseCaseGlassNode({
  intentKey,
  accent,
  icon: Icon,
  title,
  subtitle,
  desc,
  tag,
  videoSrc,
}: {
  intentKey: IntentKey;
  accent: LandingNeonAccent;
  icon: typeof Zap;
  title: string;
  subtitle: string;
  desc: string;
  tag: string;
  videoSrc: string;
}) {
  const { ref, startDwell, cancelDwell } = useCardDwell(intentKey);

  return (
    <article
      ref={ref}
      onPointerEnter={() => startDwell(intentKey)}
      onPointerLeave={() => cancelDwell(intentKey)}
      className="landing-glass-node group relative flex h-full flex-col overflow-hidden p-8"
      style={{
        ...accentStyle(accent),
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03) inset, 0 16px 40px rgba(0,0,0,0.35), 0 0 28px rgba(${LANDING_ACCENT_RGB[accent]}, 0.06)`,
      }}
    >
      <span className="landing-glass-node-shine" aria-hidden />
      <span className="landing-glass-node-handle landing-glass-node-handle--left" aria-hidden />
      <span className="landing-glass-node-handle landing-glass-node-handle--right" aria-hidden />

      <LandingFeatureVideo
        src={videoSrc}
        label={title}
        className="mb-5 -mx-1 w-[calc(100%+0.5rem)]"
      />

      <div
        className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800/60 bg-black/30"
        style={{ color: `rgb(${LANDING_ACCENT_RGB[accent]})` }}
        aria-hidden
      >
        <Icon size={22} strokeWidth={2} />
      </div>

      <h3 className="landing-glass-heading mb-1 text-xl text-white">{title}</h3>
      <p
        className="mb-3 text-sm font-semibold text-white/85"
        style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
      >
        {subtitle}
      </p>
      <p
        className="mb-5 flex-1 text-sm leading-relaxed text-white/55"
        style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
      >
        {desc}
      </p>
      <span
        className="inline-flex w-fit rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em]"
        style={{
          fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
          borderColor: `rgba(${LANDING_ACCENT_RGB[accent]}, 0.35)`,
          background: `rgba(${LANDING_ACCENT_RGB[accent]}, 0.08)`,
          color: `rgb(${LANDING_ACCENT_RGB[accent]})`,
        }}
      >
        {tag}
      </span>
    </article>
  );
}

export function LandingUseCasesSection() {
  const t = useTranslations("landingPage.useCases");

  return (
    <section
      id="use-cases"
      data-landing-glow="visuals"
      className="relative border-t border-zinc-800/50 px-4 py-12 md:px-6 md:py-16 lg:px-10 lg:py-20"
      aria-labelledby="use-cases-heading"
    >
      <div className="landing-glass-dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(3,3,4,0.85) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1160px]">
        <SpringReveal>
          <p className="landing-neon-section-kicker landing-neon-section-kicker--yellow mb-2 text-center">
            {t("kicker")}
          </p>
          <h2
            id="use-cases-heading"
            className="landing-glass-heading mb-10 text-center text-[clamp(1.75rem,5vw,3rem)] text-white md:mb-12"
          >
            {t("headline")}
          </h2>
        </SpringReveal>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {USE_CASES.map(({ key, icon, accent, intentKey, videoSrc }, i) => (
            <SpringReveal key={key} delay={i * 0.08}>
              <UseCaseGlassNode
                intentKey={intentKey}
                accent={accent}
                icon={icon}
                videoSrc={videoSrc}
                title={t(`${key}_title`)}
                subtitle={t(`${key}_subtitle`)}
                desc={t(`${key}_desc`)}
                tag={t(`${key}_tag`)}
              />
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
