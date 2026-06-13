"use client";

import { memo } from "react";
import { TrendingUp, Zap } from "lucide-react";
import type { ViralPrediction } from "@/utils/viralPredictor";

type ViralPredictorPanelProps = {
  prediction: ViralPrediction;
  onKeywordClick: (keyword: string) => void;
  compact?: boolean;
};

function scoreColor(score: number): string {
  if (score >= 75) return "#ccff00";
  if (score >= 50) return "#00d5ff";
  return "#a78bfa";
}

function ViralPredictorPanelComponent({
  prediction,
  onKeywordClick,
}: ViralPredictorPanelProps) {
  const { score, suggestedKeywords, matchedNiches } = prediction;
  const accent = scoreColor(score);

  return (
    <div className="viral-predictor-panel mt-3 rounded-xl border border-zinc-800/60 bg-black/45 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} className="text-[#ccff00]/80" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Viral-Potenzial
          </span>
        </div>
        <span
          className="font-mono text-sm font-bold tabular-nums"
          style={{ color: accent, textShadow: `0 0 12px ${accent}44` }}
        >
          {score}%
        </span>
      </div>

      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-zinc-900">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${accent}88, ${accent})`,
            boxShadow: `0 0 10px ${accent}55`,
          }}
        />
      </div>

      {matchedNiches.length > 0 ? (
        <p className="mb-2 text-[9px] leading-snug text-[#ccff00]/75">
          <Zap size={9} className="mr-0.5 inline" aria-hidden />
          Trend-Nische erkannt: {matchedNiches[0]}
        </p>
      ) : null}

      {suggestedKeywords.length > 0 ? (
        <div>
          <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-500">
            Trend-Keywords für dich
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedKeywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => onKeywordClick(keyword)}
                className="rounded-full border border-zinc-700/60 bg-zinc-950/80 px-2 py-0.5 text-[10px] text-zinc-300 transition-all hover:border-[#ccff00]/45 hover:bg-[#ccff00]/10 hover:text-[#ccff00]"
              >
                + {keyword}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[9px] text-zinc-600">Alle Top-Trend-Keywords bereits im Prompt.</p>
      )}
    </div>
  );
}

export const ViralPredictorPanel = memo(ViralPredictorPanelComponent);
