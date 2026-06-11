"use client";

import Link from "next/link";
import {
  Sparkles,
  CalendarDays,
  UserRound,
  ImageIcon,
  TrendingUp,
  Bot,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

const BENTO_TOOLS = [
  {
    key: "ki_agent",
    href: "/dashboard/ki-agent",
    icon: Bot,
    large: true,
    gridClass: "md:col-span-2 md:row-span-2",
  },
  {
    key: "viral_hook",
    href: "/dashboard/viral-hook",
    icon: Sparkles,
    large: false,
    gridClass: "",
  },
  {
    key: "content_kalender",
    href: "/dashboard/content-kalender",
    icon: CalendarDays,
    large: false,
    gridClass: "",
  },
  {
    key: "trend_script",
    href: "/dashboard/trend-to-script",
    icon: TrendingUp,
    large: false,
    gridClass: "",
  },
  {
    key: "ki_ich",
    href: "/dashboard/ki-ich",
    icon: UserRound,
    large: false,
    gridClass: "",
  },
  {
    key: "bild_generator",
    href: "/dashboard/image-generator",
    icon: ImageIcon,
    large: true,
    gridClass: "md:col-span-2",
  },
] as const;

function BentoCard({
  toolKey,
  href,
  icon: Icon,
  large,
}: {
  toolKey: (typeof BENTO_TOOLS)[number]["key"];
  href: string;
  icon: (typeof BENTO_TOOLS)[number]["icon"];
  large: boolean;
}) {
  const t = useTranslations("landingPage.bentoTools");

  return (
    <Link
      href={href}
      className={`group relative flex h-full min-h-[140px] flex-col justify-end overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 no-underline transition-all duration-300 hover:border-[#B4FF00]/45 hover:-translate-y-0.5 ${large ? "min-h-[200px] md:min-h-[260px]" : ""}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(180,255,0,0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(180,255,0,0.06), transparent 50%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(180,255,0,0.04) 0%, transparent 40%, rgba(255,255,255,0.02) 100%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#060608]/60 text-[#B4FF00] transition-colors group-hover:border-[#B4FF00]/40">
          <Icon size={18} strokeWidth={2} />
        </div>
        <h3
          className="text-white"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: large ? "1.5rem" : "1.2rem",
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          {t(`${toolKey}_name`)}
        </h3>
        <p
          className="text-sm leading-snug"
          style={{
            color: "#888888",
            fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
          }}
        >
          {t(`${toolKey}_benefit`)}
        </p>
      </div>
    </Link>
  );
}

export function LandingBentoToolsSection() {
  const t = useTranslations("landingPage.bentoTools");

  return (
    <section
      id="tools-bento"
      className="border-t border-white/[0.06] bg-[#060608] px-[clamp(20px,6vw,64px)] py-16 md:py-20"
      aria-labelledby="bento-tools-heading"
    >
      <div className="mx-auto max-w-[1160px]">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-3 md:auto-rows-fr md:gap-4">
          {BENTO_TOOLS.map((tool, i) => (
            <SpringReveal
              key={tool.key}
              delay={i * 0.06}
              className={tool.gridClass}
            >
              <BentoCard
                toolKey={tool.key}
                href={tool.href}
                icon={tool.icon}
                large={tool.large}
              />
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
