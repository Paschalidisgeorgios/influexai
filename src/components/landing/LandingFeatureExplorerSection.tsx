"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BrainCircuit,
  ChevronRight,
  Clapperboard,
  FileText,
  Gauge,
  ImageIcon,
  ShoppingBag,
  Video,
  type LucideIcon,
} from "lucide-react";
import { SpringReveal } from "@/components/ui/SpringReveal";

type FeatureLink = {
  key: string;
  href: string;
};

type FeatureGroup = {
  id: string;
  icon: LucideIcon;
  preview: PreviewVariant;
  links: FeatureLink[];
};

type FeatureColumn = {
  id: string;
  groups: FeatureGroup[];
};

const PREVIEW_VARIANTS = [
  "scripts",
  "images",
  "video",
  "agent",
  "live",
  "export",
] as const;

type PreviewVariant = (typeof PREVIEW_VARIANTS)[number];

const FEATURE_COLUMNS: FeatureColumn[] = [
  {
    id: "create",
    groups: [
      {
        id: "scripts",
        icon: FileText,
        preview: "scripts",
        links: [
          { key: "script", href: "/dashboard/script-generator" },
          { key: "hook", href: "/dashboard/viral-hook" },
          { key: "trend", href: "/dashboard/trend-to-script" },
          { key: "calendar", href: "/dashboard/content-kalender" },
        ],
      },
      {
        id: "ads",
        icon: ShoppingBag,
        preview: "scripts",
        links: [
          { key: "product", href: "/dashboard/produkt" },
          { key: "ad", href: "/dashboard/ad-creator" },
          { key: "thumbnail", href: "/dashboard/thumbnail-concept" },
        ],
      },
    ],
  },
  {
    id: "visuals",
    groups: [
      {
        id: "images",
        icon: ImageIcon,
        preview: "images",
        links: [
          { key: "imageGen", href: "/dashboard/image-generator" },
          { key: "kiIch", href: "/dashboard/ki-ich" },
          { key: "lora", href: "/dashboard/lora-training" },
        ],
      },
      {
        id: "video",
        icon: Clapperboard,
        preview: "video",
        links: [
          { key: "story", href: "/dashboard/story-creator" },
          { key: "scene", href: "/dashboard/szenen-generator" },
          { key: "transform", href: "/dashboard/video-transformer" },
          { key: "seedance", href: "/dashboard/seedance" },
        ],
      },
    ],
  },
  {
    id: "automate",
    groups: [
      {
        id: "agent",
        icon: BrainCircuit,
        preview: "agent",
        links: [
          { key: "autopilot", href: "/dashboard/ki-agent" },
          { key: "campaign", href: "/dashboard/campaign-autopilot" },
        ],
      },
      {
        id: "live",
        icon: Video,
        preview: "live",
        links: [
          { key: "liveCreator", href: "/dashboard/live-creator" },
          { key: "melodia", href: "/dashboard/melodia" },
          { key: "lipsync", href: "/dashboard/lipsync-studio" },
        ],
      },
      {
        id: "export",
        icon: Gauge,
        preview: "export",
        links: [
          { key: "score", href: "/dashboard/viral-score" },
          { key: "gallery", href: "/dashboard/gallery" },
          { key: "competitor", href: "/dashboard/competitor" },
        ],
      },
    ],
  },
];

const DEFAULT_PREVIEW: PreviewVariant = "agent";

export function LandingFeatureExplorerSection() {
  const t = useTranslations("landingPage.campaignStudio.featureExplorer");
  const [activePreview, setActivePreview] = useState<PreviewVariant>(DEFAULT_PREVIEW);
  const [activeGroup, setActiveGroup] = useState("agent");

  const handleGroupEnter = (group: FeatureGroup) => {
    setActiveGroup(group.id);
    setActivePreview(group.preview);
  };

  return (
    <section
      id="tools"
      className="campaign-light-section border-t border-black/[0.06] px-4 py-16 md:px-6 md:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-[1240px]">
        <SpringReveal>
          <span className="campaign-kicker">{t("kicker")}</span>
          <h2 className="campaign-heading mt-2 max-w-[720px]">{t("headline")}</h2>
          <p className="mt-4 max-w-[600px] text-sm leading-relaxed text-[#1a1a1a]/65 md:text-base">
            {t("subheadline")}
          </p>
        </SpringReveal>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_400px]">
          <SpringReveal delay={0.06} className="min-w-0">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {FEATURE_COLUMNS.map((column) => (
                <div key={column.id} className="min-w-0">
                  <p className="feature-explorer-col-title">{t(`columns.${column.id}`)}</p>
                  <div className="mt-5 space-y-8">
                    {column.groups.map((group) => {
                      const Icon = group.icon;
                      const isActive = activeGroup === group.id;
                      return (
                        <div
                          key={group.id}
                          className={`feature-explorer-group ${isActive ? "feature-explorer-group--active" : ""}`}
                          onMouseEnter={() => handleGroupEnter(group)}
                          onFocusCapture={() => handleGroupEnter(group)}
                        >
                          <div className="mb-3 flex items-start gap-3">
                            <span className="feature-explorer-icon">
                              <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                            </span>
                            <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-[#0a0a0a]">
                              {t(`groups.${group.id}.title`)}
                            </h3>
                          </div>
                          <ul className="space-y-1.5 pl-[46px]">
                            {group.links.map((link) => (
                              <li key={link.key}>
                                <Link
                                  href={link.href}
                                  className="feature-explorer-link group/link"
                                  onMouseEnter={() => handleGroupEnter(group)}
                                  onFocus={() => handleGroupEnter(group)}
                                >
                                  <span>{t(`links.${link.key}`)}</span>
                                  <ChevronRight
                                    className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover/link:translate-x-0.5 group-hover/link:opacity-60 group-focus-visible/link:opacity-60"
                                    strokeWidth={2}
                                  />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SpringReveal>

          <SpringReveal delay={0.12} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <FeaturePreviewCard preview={activePreview} />
          </SpringReveal>
        </div>
      </div>
    </section>
  );
}

function FeaturePreviewCard({ preview }: { preview: PreviewVariant }) {
  const t = useTranslations("landingPage.campaignStudio.featureExplorer.preview");

  return (
    <article
      className={`feature-explorer-preview feature-explorer-preview--${preview}`}
    >
      <div className="feature-explorer-preview__visual" aria-hidden />
      <div className="feature-explorer-preview__overlay">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#B4FF00] text-sm text-[#060608]">
            I
          </span>
          <span className="text-sm font-semibold text-white">
            {t(`${preview}.badge`)}
          </span>
        </div>

        <blockquote className="mt-auto pt-8 text-[clamp(1.75rem,4vw,2.25rem)] leading-[0.95] tracking-wide text-white">
          „{t(`${preview}.quote`)}“
        </blockquote>

        <Link
          href={t(`${preview}.href`)}
          className="mt-5 inline-flex min-h-[44px] w-fit items-center justify-center rounded-full bg-[#0a0a0a]/85 px-5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-[#0a0a0a]"
        >
          {t(`${preview}.cta`)}
        </Link>
      </div>
    </article>
  );
}
