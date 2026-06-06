"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MotionModal } from "@/components/ui/MotionModal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";

type Props = {
  open: boolean;
};

export function NoPlanModal({ open }: Props) {
  const t = useTranslations("planGate");

  return (
    <MotionModal
      open={open}
      overlayClassName="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#060608]/72 backdrop-blur-[2px]"
      className="max-w-md w-full rounded-2xl border border-[#B4FF00]/25 bg-[#0f0f12] p-6 shadow-2xl"
    >
      <p className="text-[#B4FF00] text-xs font-bold uppercase tracking-[0.14em] mb-2">
        {t("kicker")}
      </p>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-[#F0EFE8] mb-2 leading-tight">
        {t("title")}
      </h2>
      <p className="text-white/80 text-sm mb-6 leading-relaxed">{t("body")}</p>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <AcidMotionButton href="/pricing" className="btn-acid flex-1 justify-center">
          {t("cta")}
        </AcidMotionButton>
        <Link
          href="/dashboard"
          className="btn-ghost flex-1 justify-center text-center py-2.5"
        >
          {t("back")}
        </Link>
      </div>
    </MotionModal>
  );
}
