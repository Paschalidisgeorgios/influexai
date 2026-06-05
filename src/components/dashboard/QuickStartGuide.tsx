"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Search, Sparkles } from "lucide-react";

type Props = {
  show: boolean;
};

const STEPS = [
  {
    href: "/dashboard/niche-analyzer",
    icon: Search,
    titleKey: "step1_title" as const,
    descKey: "step1_desc" as const,
  },
  {
    href: "/dashboard/script-generator",
    icon: FileText,
    titleKey: "step2_title" as const,
    descKey: "step2_desc" as const,
  },
  {
    href: "/dashboard/ki-ich",
    icon: Sparkles,
    titleKey: "step3_title" as const,
    descKey: "step3_desc" as const,
  },
];

export function QuickStartGuide({ show }: Props) {
  const t = useTranslations("dashboard");

  if (!show) return null;

  return (
    <section className="mb-6 rounded-2xl border border-[#B4FF00]/25 bg-[#B4FF00]/[0.06] p-5">
      <h2 className="text-lg font-bold text-[#F0EFE8] mb-1">{t("quickstart_title")}</h2>
      <p className="text-sm text-white/80 mb-4">{t("quickstart_subtitle")}</p>
      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className="flex gap-3 min-h-[44px] p-4 rounded-xl border border-white/10 bg-[#0f0f12] hover:border-[#B4FF00]/30 transition-colors h-full"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B4FF00]/15 text-[#B4FF00] font-bold text-sm">
                  {i + 1}
                </span>
                <div>
                  <span className="flex items-center gap-2 font-semibold text-[#F0EFE8] text-sm mb-1">
                    <Icon size={16} className="text-[#B4FF00]" />
                    {t(step.titleKey)}
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
