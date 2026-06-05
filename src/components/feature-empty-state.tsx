"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function FeatureEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-white/10 bg-[#0f0f12]">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#B4FF00]/10 border border-[#B4FF00]/25 mb-4">
        <Icon size={32} className="text-[#B4FF00]" strokeWidth={1.75} />
      </span>
      <h3 className="text-lg font-bold text-[#F0EFE8] mb-2">{title}</h3>
      <p className="text-sm text-white/80 max-w-md mb-6 leading-relaxed">{description}</p>
      <Link
        href={ctaHref}
        className="inline-flex items-center justify-center min-h-[44px] min-w-[200px] px-6 py-3 rounded-xl bg-[#B4FF00] text-[#060608] font-bold text-sm"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
