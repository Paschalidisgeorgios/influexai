"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, ExternalLink, RefreshCw, X } from "lucide-react";
import { useCanvasAnalytics } from "@/hooks/useCanvasAnalytics";
import { CanvasDonutChart } from "./analytics/CanvasDonutChart";
import { CanvasSparkline } from "./analytics/CanvasSparkline";

type CanvasAnalyticsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram Reels",
  youtube: "YouTube Shorts",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pct(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function CanvasAnalyticsPanelComponent({ open, onOpenChange }: CanvasAnalyticsPanelProps) {
  const { data, loading, error, refresh } = useCanvasAnalytics(open);
  const { creditBreakdown, postMetrics, roi, activity } = data;
  const total = creditBreakdown.total || 1;

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`canvas-analytics-trigger pointer-events-auto absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
          open
            ? "border-[#ccff00]/40 bg-[#ccff00]/10 text-[#ccff00]"
            : "border-zinc-800/70 bg-zinc-950/70 text-zinc-500 hover:border-[#ccff00]/30 hover:text-[#ccff00]"
        }`}
        aria-label="Studio Analytics"
        aria-expanded={open}
      >
        <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="canvas-analytics-panel pointer-events-auto absolute top-14 right-4 z-30 flex w-[min(340px,calc(100vw-1.5rem))] max-h-[min(78vh,640px)] flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/70 shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            aria-label="Studio Analytics"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/60 px-3.5 py-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Studio Analytics
                </p>
                <p className="text-xs font-medium text-zinc-300">Letzte 30 Tage</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
                  aria-label="Aktualisieren"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
                  aria-label="Schließen"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="nodrag nowheel flex-1 overflow-y-auto overscroll-contain px-3.5 py-3">
              {error ? (
                <p className="mb-3 text-[10px] text-red-400/90">{error}</p>
              ) : null}

              <div className="mb-3 grid gap-2">
                <div className="canvas-metric-tile rounded-lg border border-zinc-800/60 bg-black/25 p-3">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Coin-Verbrauch
                  </p>
                  <div className="flex items-center gap-3">
                    <CanvasDonutChart
                      segments={[
                        { label: "Video", value: creditBreakdown.video, color: "#ccff00" },
                        { label: "Bild", value: creditBreakdown.image, color: "#a855f7" },
                        { label: "Text", value: creditBreakdown.text, color: "#52525b" },
                      ]}
                    />
                    <ul className="min-w-0 flex-1 space-y-1.5 text-[10px]">
                      <li className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#ccff00]" />
                          Video
                        </span>
                        <span className="tabular-nums text-zinc-300">
                          {pct(creditBreakdown.video, total)}%
                        </span>
                      </li>
                      <li className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#a855f7]" />
                          Bilder
                        </span>
                        <span className="tabular-nums text-zinc-300">
                          {pct(creditBreakdown.image, total)}%
                        </span>
                      </li>
                      <li className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                          Text
                        </span>
                        <span className="tabular-nums text-zinc-300">
                          {pct(creditBreakdown.text, total)}%
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="canvas-metric-tile rounded-lg border border-zinc-800/60 bg-black/25 p-3">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Post-Performance
                  </p>
                  {postMetrics.hasRealMetrics ? (
                    <div className="flex gap-2">
                      <CanvasSparkline
                        data={postMetrics.views}
                        color="#ccff00"
                        label="Views"
                        total={postMetrics.totals.views}
                      />
                      <CanvasSparkline
                        data={postMetrics.likes}
                        color="#a855f7"
                        label="Likes"
                        total={postMetrics.totals.likes}
                      />
                      <CanvasSparkline
                        data={postMetrics.shares}
                        color="#38bdf8"
                        label="Shares"
                        total={postMetrics.totals.shares}
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center">
                      <p className="text-[10px] leading-relaxed text-zinc-500">
                        Performance-Daten — Plattform-Verbindung folgt in einem
                        späteren Update.
                      </p>
                    </div>
                  )}
                </div>

                <div className="canvas-metric-tile rounded-lg border border-zinc-800/60 bg-black/25 p-3">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    ROI-Kalkulator
                  </p>
                  <p className="text-[11px] leading-relaxed text-zinc-300">
                    Ø Kosten pro 1.000 Views:{" "}
                    <span className="font-semibold text-[#ccff00]">
                      {roi.creditsPer1000Views.toLocaleString("de-DE")} Credits
                    </span>
                    {postMetrics.hasRealMetrics && roi.creditsPer1000Views > 0 ? (
                      <>
                        {" "}
                        <span className="text-zinc-500">(ca.</span>{" "}
                        <span className="font-semibold text-white">
                          {roi.eurPer1000Views.toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                        <span className="text-zinc-500">)</span>
                      </>
                    ) : (
                      <span className="text-zinc-600">
                        {" "}
                        — verfügbar sobald Plattform-Metriken angebunden sind
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Aktivitäts-Log
                </p>
                <ul className="canvas-activity-log max-h-[180px] space-y-1 overflow-y-auto overscroll-contain pr-0.5">
                  {activity.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-zinc-800/60 px-3 py-4 text-center text-[10px] text-zinc-600">
                      Noch keine Generierungen in den letzten 30 Tagen.
                    </li>
                  ) : (
                    activity.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg border border-zinc-800/50 bg-black/20 px-2 py-1.5"
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800/60 bg-zinc-900/50 text-xs"
                          aria-hidden
                        >
                          {item.toolIcon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-medium text-zinc-300">
                            {item.toolLabel}
                          </p>
                          <p className="text-[9px] text-zinc-600">
                            {formatDate(item.createdAt)}
                            {item.creditsUsed > 0 ? ` · ${item.creditsUsed} Coins` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {item.status === "posted" && item.platform ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-[8px] font-medium text-[#ccff00]/90">
                                Gepostet · {PLATFORM_LABELS[item.platform] ?? item.platform}
                              </span>
                              {item.liveUrl ? (
                                <a
                                  href={item.liveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[8px] text-zinc-500 hover:text-[#ccff00]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Live
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-[8px] uppercase tracking-wider text-zinc-600">
                              Generiert
                            </span>
                          )}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export const CanvasAnalyticsPanel = memo(CanvasAnalyticsPanelComponent);
