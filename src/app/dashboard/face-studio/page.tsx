"use client";

import { useState } from "react";
import { FaceSwapPanel } from "@/components/live-creator/face-swap-panel";

type Tab = "video" | "photo";

export default function FaceStudioPage() {
  const [tab, setTab] = useState<Tab>("video");

  return (
    <div className="max-w-xl mx-auto pb-16 px-1">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[#B4FF00] text-[0.7rem] font-bold uppercase tracking-[0.14em]">
            Avatar & Live
          </p>
        </div>
        <h1 className="font-[family-name:var(--font-bebas)] text-4xl text-[#F0EFE8] leading-tight mb-2">
          FACE STUDIO
        </h1>
        <p className="text-white/80 text-sm">
          Face Swap für eigene Videos und Fotos — nur mit Einwilligung aller
          abgebildeten Personen
        </p>
      </header>

      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
        <button
          type="button"
          onClick={() => setTab("video")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "video"
              ? "bg-[#B4FF00] text-[#060608]"
              : "text-white/80 hover:text-white"
          }`}
        >
          Face Swap Video
        </button>
        <button
          type="button"
          onClick={() => setTab("photo")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "photo"
              ? "bg-[#B4FF00] text-[#060608]"
              : "text-white/80 hover:text-white"
          }`}
        >
          Face Swap Foto
        </button>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0f0f12]/80 p-5 md:p-6">
        {tab === "video" ? (
          <FaceSwapPanel
            mode="video"
            sourceLabel="Schritt 1 · Quell-Video (Person die spricht)"
            sourceTip="MP4, MOV oder WebM · max. 50 MB · Frontalaufnahme, gute Beleuchtung"
            targetLabel="Schritt 2 · Ziel-Gesicht (wird eingesetzt)"
            targetTip="Klares Gesichtsfoto · Frontalaufnahme · JPG oder PNG"
            acceptSource="video/mp4,video/quicktime,video/webm"
            sourceIsVideo
          />
        ) : (
          <FaceSwapPanel
            mode="image"
            sourceLabel="Schritt 1 · Quell-Foto (Originalperson)"
            sourceTip="JPG oder PNG · die Person auf dem Foto wird ersetzt"
            targetLabel="Schritt 2 · Ziel-Gesicht (neues Gesicht)"
            targetTip="Klares Gesichtsfoto · Frontalaufnahme"
            acceptSource="image/jpeg,image/png,image/webp"
          />
        )}
      </div>
    </div>
  );
}
