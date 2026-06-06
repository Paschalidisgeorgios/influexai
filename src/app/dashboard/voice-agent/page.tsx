"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

function cardStyle() {
  return {
    padding: 32,
    borderRadius: 16,
    background: "#0f0f12",
    border: "1px solid rgba(255,255,255,0.07)",
  } as const;
}

export default function VoiceAgentPage() {
  const t = useTranslations("voiceAgentPage");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
      <div style={cardStyle()} className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B4FF00]/10 text-[#B4FF00]">
          <Bot size={28} strokeWidth={2} />
        </div>
        <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/70">
          {t("badge")}
        </span>
        <h1 className="mt-4 text-2xl font-bold text-[#F0EFE8]">{t("title")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">{t("body")}</p>
        <p className="mt-4 text-sm text-white/45">{t("elevenlabs_hint")}</p>
        <Link
          href="/dashboard/voice"
          className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#B4FF00]/40 px-6 text-sm font-semibold text-[#B4FF00] hover:bg-[#B4FF00]/8"
        >
          {t("voice_cta")}
        </Link>
      </div>
    </div>
  );
}
