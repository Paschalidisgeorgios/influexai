"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

const DEFAULT_COLORS = ["#ccff00", "#8b5cf6", "#22d3ee"] as const;

type WhitelabelLivePreviewProps = {
  agencyName: string;
  onAgencyNameChange: (value: string) => void;
};

export function WhitelabelLivePreview({
  agencyName,
  onAgencyNameChange,
}: WhitelabelLivePreviewProps) {
  const t = useTranslations("agencyPage.whitelabel");
  const [colors, setColors] = useState<[string, string, string]>([...DEFAULT_COLORS]);

  const displayName = agencyName.trim() || t("default_name");

  const sidebarItems = useMemo(
    () => ["Script", "KI-Ich", "Live Creator", "Remix"],
    []
  );

  const setColorAt = (index: 0 | 1 | 2, value: string) => {
    setColors((prev) => {
      const next: [string, string, string] = [...prev];
      next[index] = value;
      return next;
    });
  };

  return (
    <section
      id="agency-whitelabel"
      className="py-20 px-[clamp(20px,6vw,64px)] border-t border-zinc-800/40"
    >
      <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <span className="studio-glass-kicker">{t("kicker")}</span>
          <h2 className="landing-heading text-[clamp(2rem,4vw,3rem)] mb-4 leading-tight">
            {t("headline")}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-md">
            {t("subline")}
          </p>

          <label className="block mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 block">
              {t("name_label")}
            </span>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => onAgencyNameChange(e.target.value)}
              placeholder={t("name_placeholder")}
              className="studio-glass-input"
            />
          </label>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3 block">
              {t("colors_label")}
            </span>
            <div className="flex flex-wrap gap-4">
              {colors.map((color, i) => (
                <label key={i} className="flex flex-col items-center gap-2 cursor-pointer">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColorAt(i as 0 | 1 | 2, e.target.value)}
                    className="h-11 w-11 rounded-full border-2 border-white/20 cursor-pointer bg-transparent p-0 overflow-hidden"
                    aria-label={t("color_picker", { index: i + 1 })}
                  />
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">
                    {t(`color_${i + 1}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div
          className="studio-glass-card overflow-hidden shadow-2xl"
          style={{ boxShadow: `0 24px 80px ${colors[1]}22` }}
        >
          <div
            className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800/60"
            style={{ background: "rgba(9,9,11,0.6)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-black"
              style={{ background: colors[0] }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-sm" style={{ color: colors[0] }}>
              {displayName}
            </span>
            <span className="ml-auto text-[0.65rem] text-white/50 px-2 py-1 rounded border border-zinc-800/60">
              {t("powered_by")}
            </span>
          </div>

          <div className="flex min-h-[300px]">
            <div
              className="w-44 shrink-0 p-3 border-r border-zinc-800/60 hidden sm:block"
              style={{ background: "rgba(5,5,5,0.5)" }}
            >
              {sidebarItems.map((item, idx) => (
                <div
                  key={item}
                  className="py-2 px-3 rounded-lg text-xs mb-1 transition-colors"
                  style={{
                    color: idx === 0 ? colors[0] : "rgba(255,255,255,0.45)",
                    background:
                      idx === 0 ? `${colors[1]}22` : "transparent",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="flex-1 p-5" style={{ background: "rgba(5,5,5,0.35)" }}>
              <p className="text-xs text-white/50 mb-3">{t("workspace_label")}</p>
              <div
                className="h-28 rounded-xl border border-dashed flex items-center justify-center text-sm mb-4"
                style={{
                  borderColor: `${colors[2]}55`,
                  color: colors[2],
                  background: `${colors[2]}0a`,
                }}
              >
                {t("canvas_placeholder")}
              </div>
              <div className="flex gap-2">
                <div
                  className="h-16 flex-1 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors[0]}33, ${colors[1]}22)`,
                    border: `1px solid ${colors[0]}33`,
                  }}
                />
                <div
                  className="h-16 flex-1 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors[1]}33, ${colors[2]}22)`,
                    border: `1px solid ${colors[1]}33`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
