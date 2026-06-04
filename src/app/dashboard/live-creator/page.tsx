"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LiveCreatorStudio } from "@/components/live-creator/LiveCreatorStudio";
import TalkingAvatarPage from "./talking-avatar-page";

type Tab = "studio" | "talking";

export default function LiveCreatorPage() {
  const t = useTranslations("liveCreatorStudio");
  const [tab, setTab] = useState<Tab>("studio");

  return (
    <div className="pb-8">
      <header className="max-w-[420px] mx-auto mb-6 px-1">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[#B4FF00] text-[0.7rem] font-bold uppercase tracking-[0.14em]">
            {t("live_creator_label")}
          </p>
          <span className="bg-red-600 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full animate-pulse">
            LIVE
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-bebas)] text-4xl text-[#F0EFE8] leading-tight mb-2">
          {t("title")}
        </h1>
        <p className="text-white/50 text-sm">{t("subtitle")}</p>
      </header>

      <div className="max-w-[420px] mx-auto flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 px-1">
        <button
          type="button"
          onClick={() => setTab("studio")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "studio"
              ? "bg-[#B4FF00] text-[#060608]"
              : "text-white/50 hover:text-white"
          }`}
        >
          {t("tab_studio")}
        </button>
        <button
          type="button"
          onClick={() => setTab("talking")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "talking"
              ? "bg-[#B4FF00] text-[#060608]"
              : "text-white/50 hover:text-white"
          }`}
        >
          {t("tab_talking")}
        </button>
      </div>

      {tab === "studio" ? (
        <LiveCreatorStudio />
      ) : (
        <TalkingAvatarPage embedded />
      )}
    </div>
  );
}
