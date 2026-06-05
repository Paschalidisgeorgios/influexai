"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  title: string;
  tagline: string;
  creditLabel: string;
  icon: LucideIcon;
  badge?: "NEU" | "SOON";
  disabled?: boolean;
  lockedLabel?: string;
  onClick: () => void;
};

export function FeatureCard({
  title,
  tagline,
  creditLabel,
  icon: Icon,
  badge,
  disabled,
  lockedLabel,
  onClick,
}: Props) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled && !lockedLabel}
      whileHover={
        disabled
          ? undefined
          : {
              scale: 1.02,
              borderColor: "rgba(180,255,0,0.4)",
            }
      }
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`
        glass-card group relative w-full min-h-[180px] text-left p-5
        min-w-[260px] snap-start shrink-0 md:min-w-0 md:shrink
        ${disabled ? "opacity-80 cursor-not-allowed" : "cursor-pointer hover:shadow-[0_0_0_1px_rgba(180,255,0,0.25)]"}
      `}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#B4FF00] opacity-40 group-hover:opacity-80 rounded-t-2xl" />

      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B4FF00]/10 border border-[#B4FF00]/25">
          <Icon size={22} className="text-[#B4FF00]" strokeWidth={2} />
        </span>
        {badge === "NEU" && (
          <span className="text-[0.62rem] font-extrabold px-2 py-0.5 rounded-md bg-[#B4FF00]/15 border border-[#B4FF00]/35 text-[#B4FF00] tracking-wide">
            NEU
          </span>
        )}
        {badge === "SOON" && (
          <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded-md bg-white/5 text-white/75">
            {tCommon("coming_soon")}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 leading-tight font-[family-name:var(--font-syne)]">
        {title}
      </h3>
      <p className="text-sm text-white/75 leading-relaxed mb-4 line-clamp-2">
        {tagline}
      </p>

      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="text-xs font-semibold text-[#B4FF00]">{creditLabel}</span>
        {!disabled && (
          <span className="text-xs font-bold text-[#060608] bg-[#B4FF00] px-3 py-2 rounded-lg min-h-[36px] inline-flex items-center">
            {t("feature_start")}
          </span>
        )}
        {lockedLabel && (
          <span className="text-xs text-white/75">{lockedLabel}</span>
        )}
      </div>
    </motion.button>
  );
}
