"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BrainCircuit,
  Clapperboard,
  Download,
  Gauge,
  ImageIcon,
} from "lucide-react";
import { SpringReveal } from "@/components/ui/SpringReveal";

const TOOLS = [
  {
    key: "image",
    icon: ImageIcon,
    href: "/dashboard/image-generator",
    span: "lg:col-span-2 lg:row-span-2",
    featured: true,
  },
  {
    key: "video",
    icon: Clapperboard,
    href: "/dashboard/seedance",
    span: "",
    featured: false,
  },
  {
    key: "agent",
    icon: BrainCircuit,
    href: "/dashboard/ki-agent",
    span: "",
    featured: false,
  },
  {
    key: "score",
    icon: Gauge,
    href: "/dashboard/viral-score",
    span: "",
    featured: false,
  },
  {
    key: "gallery",
    icon: Download,
    href: "/dashboard/gallery",
    span: "lg:col-span-2",
    featured: false,
  },
] as const;

export function LandingStudioToolsSection() {
  const t = useTranslations("landingPage.campaignStudio.tools");

  return (
    <section
      id="tools"
      className="campaign-light-section border-t border-black/[0.06] px-4 py-16 md:px-6 md:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <span className="campaign-kicker">{t("kicker")}</span>
          <h2 className="campaign-heading mt-2 max-w-[720px]">{t("headline")}</h2>
          <p className="mt-4 max-w-[560px] text-sm leading-relaxed text-[#1a1a1a]/65 md:text-base">
            {t("subheadline")}
          </p>
        </SpringReveal>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <SpringReveal
                key={tool.key}
                delay={i * 0.05}
                className={`min-h-0 ${tool.span}`}
              >
                <Link
                  href={tool.href}
                  className={`campaign-tool-card group block h-full ${
                    tool.featured ? "campaign-tool-card--featured" : ""
                  }`}
                >
                  <div className="flex h-full flex-col p-5 md:p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.08] bg-black/[0.03] text-[#1a1a1a]/70 transition-colors group-hover:border-[#B4FF00]/40 group-hover:text-[#5a7300]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">
                      {t(`${tool.key}_title`)}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#1a1a1a]/60">
                      {t(`${tool.key}_desc`)}
                    </p>
                    <span className="mt-4 text-xs font-medium text-[#5a7300] opacity-0 transition-opacity group-hover:opacity-100">
                      {t("openTool")} →
                    </span>
                  </div>
                </Link>
              </SpringReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
