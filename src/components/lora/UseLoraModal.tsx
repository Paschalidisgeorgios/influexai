"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MotionModal } from "@/components/ui/MotionModal";
import { LORA_USE_FEATURES } from "@/lib/lora-config";

type Props = {
  open: boolean;
  onClose: () => void;
  lora: {
    id: string;
    name: string;
    trigger_word: string;
  } | null;
};

export function UseLoraModal({ open, onClose, lora }: Props) {
  const t = useTranslations("flows.loraTraining");

  if (!lora) return null;

  return (
    <MotionModal
      open={open}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#060608]/88 backdrop-blur-sm"
      className="max-w-md w-full rounded-2xl border border-[#B4FF00]/25 bg-[#0f0f12] p-6"
    >
      <h3
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "1.6rem",
          color: "#F0EFE8",
          marginBottom: 8,
        }}
      >
        {t("use_modal_title")}
      </h3>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", marginBottom: 16 }}>
        {t("use_modal_body", { name: lora.name, trigger: lora.trigger_word })}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {LORA_USE_FEATURES.map((feat) => (
          <Link
            key={feat.id}
            href={`${feat.href}?loraId=${lora.id}&trigger=${encodeURIComponent(lora.trigger_word)}`}
            onClick={onClose}
            style={{
              display: "block",
              padding: "14px 16px",
              borderRadius: 10,
              background: "#18181d",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "#F0EFE8",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            {t(feat.labelKey)} →
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 16,
          width: "100%",
          padding: "10px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.09)",
          background: "transparent",
          color: "rgba(255,255,255,0.65)",
          cursor: "pointer",
        }}
      >
        {t("use_modal_close")}
      </button>
    </MotionModal>
  );
}
