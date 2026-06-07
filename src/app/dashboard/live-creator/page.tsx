"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LiveCreatorStudio } from "@/components/live-creator/LiveCreatorStudio";
import { TabPanelTransition } from "@/components/ui/TabPanelTransition";
import TalkingAvatarPage from "./talking-avatar-page";

type Tab = "studio" | "talking";

const TAB_ORDER: Tab[] = ["studio", "talking"];

function LiveCreatorFullPage() {
  const t = useTranslations("liveCreatorStudio");
  const [tab, setTab] = useState<Tab>("studio");
  const prevTabRef = useRef<Tab>("studio");
  const [direction, setDirection] = useState(0);

  const selectTab = (next: Tab) => {
    const prevIndex = TAB_ORDER.indexOf(prevTabRef.current);
    const nextIndex = TAB_ORDER.indexOf(next);
    setDirection(nextIndex >= prevIndex ? 1 : -1);
    prevTabRef.current = next;
    setTab(next);
  };

  return (
    <div className="pb-8">
      <header className="max-w-2xl mx-auto mb-6 px-1">
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
        <p className="text-white/80 text-sm">{t("subtitle")}</p>
      </header>

      <div className="max-w-2xl mx-auto flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6 px-1">
        <button
          type="button"
          onClick={() => selectTab("studio")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "studio"
              ? "bg-[#B4FF00] text-[#060608]"
              : "text-white/80 hover:text-white"
          }`}
        >
          {t("tab_studio")}
        </button>
        <button
          type="button"
          onClick={() => selectTab("talking")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "talking"
              ? "bg-[#B4FF00] text-[#060608]"
              : "text-white/80 hover:text-white"
          }`}
        >
          {t("tab_talking")}
        </button>
      </div>

      <TabPanelTransition tabKey={tab} direction={direction}>
        {tab === "studio" ? (
          <LiveCreatorStudio />
        ) : (
          <TalkingAvatarPage embedded />
        )}
      </TabPanelTransition>
    </div>
  );
}

export default function LiveCreatorPage() {
  const COMING_SOON = true; // auf false setzen wenn Akool ready

  if (COMING_SOON) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#060608",
          color: "#fff",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(180,255,0,0.2)",
            borderRadius: 4,
            padding: "32px 48px",
            textAlign: "center",
            maxWidth: 480,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "rgba(180,255,0,0.6)",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            InfluexAI LiveSwap™
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.04em",
              marginBottom: 12,
            }}
          >
            LIVE CREATOR
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            KI-Avatar live auf TikTok & YouTube — ohne Kamera. Dieses Feature wird
            bald freigeschaltet.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              border: "1px solid rgba(180,255,0,0.25)",
              borderRadius: 4,
              fontSize: 11,
              color: "#B4FF00",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#B4FF00",
                boxShadow: "0 0 6px #B4FF00",
              }}
            />
            Coming Soon
          </div>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,80,80,0.6)",
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            Hinweis: Live Creator nutzt Gesichtserkennung. Die Nutzung erfordert
            deine ausdrückliche Einwilligung und darf nur mit eigenem oder
            lizenziertem Bildmaterial verwendet werden.
          </p>
        </div>
      </div>
    );
  }

  return <LiveCreatorFullPage />;
}
