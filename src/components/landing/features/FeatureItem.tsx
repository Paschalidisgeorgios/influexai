"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

type Props = {
  href: string;
  label: string;
  subtitle?: string;
  icon?: LucideIcon;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export function FeatureItem({
  href,
  label,
  subtitle,
  icon: Icon,
  onNavigate,
  variant = "desktop",
}: Props) {
  if (variant === "mobile") {
    return (
      <Link
        href={href}
        className="features-mega-item features-mega-item--mobile"
        onClick={onNavigate}
      >
        <span>{label}</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" strokeWidth={2} />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg p-1 -m-1 no-underline transition-colors hover:bg-white/[0.04]"
      onClick={onNavigate}
    >
      {Icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800/70 bg-zinc-900/90 text-zinc-400 transition-colors group-hover:border-[#ccff00]/30 group-hover:text-[#ccff00]">
          <Icon className="h-4 w-4" strokeWidth={1.6} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-[13px] font-medium leading-snug text-white/90 transition-colors group-hover:text-[#ccff00]">
          {label}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
