"use client";

import { useTranslations } from "next-intl";
import { AnimatedCredits } from "@/components/ui/AnimatedCredits";
import { openBuyCreditsModal } from "@/lib/client-credits-ui";

type CreditLevel = "ok" | "low" | "critical" | "empty";

function creditLevel(credits: number, maxCredits: number): CreditLevel {
  if (credits <= 0) return "empty";
  const pct = (credits / maxCredits) * 100;
  if (pct > 20) return "ok";
  if (pct >= 10) return "low";
  return "critical";
}

function barColor(level: CreditLevel): string {
  if (level === "ok") return "var(--accent, #B4FF00)";
  if (level === "low") return "#f59e0b";
  return "#ff6b7a";
}

type Props = {
  credits: number;
  maxCredits: number;
};

export function SidebarCreditsPanel({ credits, maxCredits }: Props) {
  const tNav = useTranslations("nav");
  const level = creditLevel(credits, maxCredits);
  const percent = Math.min(100, Math.max(0, (credits / maxCredits) * 100));
  const color = barColor(level);

  const hint =
    level === "low"
      ? tNav("credits_running_low")
      : level === "critical"
        ? tNav("credits_almost_empty")
        : level === "empty"
          ? tNav("credits_empty")
          : null;

  return (
    <div className="m-2 p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[0.72rem] text-[rgba(255,255,255,0.65)] font-medium">
          {tNav("credits")}
        </span>
        <AnimatedCredits
          value={credits}
          className="text-[0.78rem] font-bold tabular-nums"
          style={{ color }}
        />
      </div>

      <div className="h-1.5 bg-[#222228] rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-500"
          style={{
            width: `${percent}%`,
            background: color,
            minWidth: level === "empty" ? 0 : credits > 0 ? "4px" : 0,
          }}
        />
      </div>

      <div className="text-[0.65rem] text-[rgba(255,255,255,0.65)] mb-2">
        {tNav("credits_balance", { current: credits, max: maxCredits })}
      </div>

      {hint && (
        <p
          className="text-[0.65rem] font-semibold mb-2 leading-snug"
          style={{
            color:
              level === "low"
                ? "#f59e0b"
                : level === "critical" || level === "empty"
                  ? "#ff6b7a"
                  : undefined,
          }}
        >
          {hint}
        </p>
      )}

      <button
        type="button"
        onClick={() => openBuyCreditsModal()}
        className={`block w-full text-center py-1.5 rounded-lg bg-[var(--accent,#B4FF00)]/10 border border-[var(--accent,#B4FF00)]/20 text-[var(--accent,#B4FF00)] text-[0.72rem] font-bold cursor-pointer transition-colors hover:bg-[var(--accent,#B4FF00)]/15 ${
          level === "empty" ? "sidebar-topup-pulse" : ""
        }`}
      >
        ⚡ {tNav("top_up")}
      </button>

      <style jsx global>{`
        @keyframes sidebar-topup-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent, #b4ff00) 45%, transparent);
          }
          50% {
            box-shadow: 0 0 0 6px transparent;
          }
        }
        .sidebar-topup-pulse {
          animation: sidebar-topup-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
