"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { engineLabelForIntent, type PreviewIntent } from "./preview-intent";

const ACCENT = "#b4ff00";

type PreviewLivePreviewProps = {
  intent: PreviewIntent;
  hasInput: boolean;
  lang: "de" | "en";
};

export function PreviewLivePreview({ intent, hasInput, lang }: PreviewLivePreviewProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const label =
    intent === "image_generation"
      ? lang === "de"
        ? "Bild-Vorschau"
        : "Image preview"
      : intent === "image_to_video"
        ? lang === "de"
          ? "Motion-Vorschau"
          : "Motion preview"
        : intent === "campaign_planning"
          ? lang === "de"
            ? "Hooks / Content Plan"
            : "Hooks / content plan"
          : intent === "asset_reuse"
            ? lang === "de"
              ? "Varianten"
              : "Variants"
            : lang === "de"
              ? "Live Preview"
              : "Live preview";

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el || !hasInput) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, {
        x: x * 6,
        y: y * 4,
        duration: 0.45,
        ease: "power3.out",
      });
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: "power3.out" });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [hasInput]);

  return (
    <div
      className="flex min-h-[280px] min-w-0 flex-col overflow-hidden rounded-lg border md:min-h-[360px]"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(10,10,16,0.94)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      data-preview-preview
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.22)" }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-400">
          {label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: ACCENT }}>
          {engineLabelForIntent(intent)}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-end p-4 md:p-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 58% 28%, rgba(180,255,0,0.12), transparent 62%)",
          }}
        />
        {!hasInput ? (
          <p className="relative text-[13px] leading-relaxed text-neutral-500">
            {lang === "de"
              ? "Vorschau erscheint, sobald ein Produktionsziel erkannt wurde."
              : "Preview appears once a production goal is recognized."}
          </p>
        ) : (
          <div className="relative space-y-3">
            <div
              ref={surfaceRef}
              className="aspect-[4/5] max-h-[220px] w-full max-w-[200px] rounded border"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
              }}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-500">
              {lang === "de" ? "Mock — kein echtes Asset" : "Mock — no real asset"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
