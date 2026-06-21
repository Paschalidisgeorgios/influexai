"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";

type DashboardWebsiteLinkProps = {
  compact?: boolean;
  className?: string;
};

export function DashboardWebsiteLink({ compact = false, className = "" }: DashboardWebsiteLinkProps) {
  const t = useTranslations("nav");

  return (
    <Link
      href="/"
      className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all hover:bg-white/[0.03] ${className}`.trim()}
      aria-label={t("view_website")}
    >
      <ExternalLink
        size={compact ? 13 : 14}
        strokeWidth={1.75}
        className="shrink-0 text-white/28 transition-colors group-hover:text-white/55"
      />
      <span
        className={`font-medium text-white/38 transition-colors group-hover:text-white/72 ${
          compact ? "text-[11px]" : "text-[12px]"
        }`}
      >
        {t("view_website")}
      </span>
    </Link>
  );
}
