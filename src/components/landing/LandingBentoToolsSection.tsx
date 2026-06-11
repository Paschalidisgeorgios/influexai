"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

const HOOK_PILLS = [
  "Diese eine Gewohnheit hat alles verändert...",
  "POV: Du entdeckst das Geheimnis von...",
  "Niemand redet darüber, aber...",
] as const;

type BentoCardProps = {
  tag: string;
  title: string;
  description: string;
  href?: string;
  className?: string;
  children?: ReactNode;
  accent?: boolean;
};

function BentoCard({
  tag,
  title,
  description,
  href,
  className = "",
  children,
  accent = false,
}: BentoCardProps) {
  const inner = (
    <article
      className={`flex h-full min-h-[180px] flex-col rounded-2xl border bg-[#0d0d0f] p-6 transition-all duration-300 hover:border-[#B4FF00]/35 ${
        accent ? "border-[#B4FF00]/20" : "border-white/[0.08]"
      } ${href ? "group no-underline" : ""} ${className}`}
    >
      <span
        className="mb-3 inline-flex w-fit rounded-full border border-[#B4FF00]/25 bg-[#B4FF00]/[0.08] px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#B4FF00]"
        style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
      >
        {tag}
      </span>
      <h3
        className="mb-2 text-white"
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: accent ? "clamp(1.35rem, 2.5vw, 1.75rem)" : "1.25rem",
          letterSpacing: "0.02em",
          lineHeight: 1.1,
        }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed text-[#888888]"
        style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
      >
        {description}
      </p>
      {children}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  }

  return inner;
}

export function LandingBentoToolsSection() {
  const t = useTranslations("landingPage.bentoTools");

  return (
    <section
      id="tools-bento"
      className="border-t border-white/[0.06] bg-[#060608] px-[clamp(20px,6vw,64px)] py-16 md:py-20"
      aria-labelledby="bento-tools-heading"
    >
      <div className="mx-auto w-full max-w-[1160px]">
        <SpringReveal>
          <p
            className="mb-2 text-center uppercase"
            style={{
              fontSize: 10,
              color: "#B4FF00",
              letterSpacing: "0.14em",
              fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
              fontWeight: 700,
            }}
          >
            {t("kicker")}
          </p>
          <h2
            id="bento-tools-heading"
            className="mb-10 text-center md:mb-12"
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 5vw, 48px)",
              color: "#ffffff",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {t("headline")}
          </h2>
        </SpringReveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
          <SpringReveal className="md:col-span-2">
            <BentoCard
              accent
              tag={t("viral_hook_tag")}
              title={t("viral_hook_name")}
              description={t("viral_hook_benefit")}
              href="/dashboard/viral-hook"
              className="min-h-[240px] md:min-h-[280px]"
            >
              <div className="mt-5 flex flex-col gap-2">
                {HOOK_PILLS.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[0.78rem] italic text-white/75"
                    style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                  >
                    {'„' + pill + '\u201C'}
                  </span>
                ))}
              </div>
            </BentoCard>
          </SpringReveal>

          <SpringReveal delay={0.06}>
            <BentoCard
              tag={t("ki_ich_tag")}
              title={t("ki_ich_name")}
              description={t("ki_ich_benefit")}
              href="/dashboard/ki-ich"
            />
          </SpringReveal>

          <SpringReveal delay={0.1}>
            <BentoCard
              tag={t("bild_generator_tag")}
              title={t("bild_generator_name")}
              description={t("bild_generator_benefit")}
              href="/dashboard/image-generator"
            />
          </SpringReveal>

          <SpringReveal delay={0.14}>
            <BentoCard
              tag={t("ki_agent_tag")}
              title={t("ki_agent_name")}
              description={t("ki_agent_benefit")}
              href="/dashboard/ki-agent"
            />
          </SpringReveal>

          <SpringReveal delay={0.18}>
            <BentoCard
              tag={t("content_kalender_tag")}
              title={t("content_kalender_name")}
              description={t("content_kalender_benefit")}
              href="/dashboard/content-kalender"
            />
          </SpringReveal>
        </div>
      </div>
    </section>
  );
}
