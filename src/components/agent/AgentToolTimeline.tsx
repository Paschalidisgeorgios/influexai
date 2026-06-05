"use client";

import { useTranslations } from "next-intl";
import type { AgentToolName } from "@/lib/agent/types";

const TIMELINE_ORDER: AgentToolName[] = [
  "analyze_niche",
  "generate_script",
  "calculate_viral_score",
  "create_thumbnail_concept",
];

const TIMELINE_LABEL_KEYS: Record<AgentToolName, string> = {
  analyze_niche: "timeline_niche",
  find_outliers: "timeline_outliers",
  generate_script: "timeline_script",
  create_thumbnail_concept: "timeline_thumbnail",
  calculate_viral_score: "timeline_viral",
  suggest_video_ideas: "timeline_ideas",
};

type StepState = {
  tool: AgentToolName;
  status: "pending" | "running" | "done" | "error";
};

type Props = {
  steps: StepState[];
};

export function AgentToolTimeline({ steps }: Props) {
  const t = useTranslations("agent");

  const statusFor = (tool: AgentToolName): StepState["status"] => {
    const match = steps.find((s) => s.tool === tool);
    return match?.status ?? "pending";
  };

  return (
    <nav
      className="shrink-0 w-full md:w-52 lg:w-56 pr-0 md:pr-6"
      aria-label={t("timeline_label")}
    >
      <ul className="flex md:flex-col gap-4 md:gap-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 snap-x md:snap-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TIMELINE_ORDER.map((tool, index) => {
          const status = statusFor(tool);
          const isLast = index === TIMELINE_ORDER.length - 1;

          return (
            <li
              key={tool}
              className="flex md:flex-row items-center gap-2 md:gap-3 shrink-0 md:shrink md:min-h-[52px] snap-start"
            >
              <div className="hidden md:flex flex-col items-center self-stretch">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    status === "done"
                      ? "bg-[#B4FF00]/20 text-[#B4FF00]"
                      : status === "running"
                        ? "bg-[#B4FF00] text-[#060608] animate-pulse"
                        : status === "error"
                          ? "bg-red-500/20 text-red-400"
                          : "border border-white/20 text-white/65"
                  }`}
                >
                  {status === "done" ? "✓" : status === "running" ? "●" : "○"}
                </span>
                {!isLast && (
                  <span
                    className={`w-px flex-1 min-h-[20px] my-1 ${
                      status === "done" ? "bg-[#B4FF00]/30" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
              <span
                className={`md:hidden text-base ${
                  status === "done"
                    ? "text-[#B4FF00]"
                    : status === "running"
                      ? "text-[#B4FF00] animate-pulse"
                      : "text-white/25"
                }`}
              >
                {status === "done" ? "●" : status === "running" ? "●" : "○"}
              </span>
              <span
                className={`text-sm whitespace-nowrap md:whitespace-normal font-medium ${
                  status === "done"
                    ? "text-white/70"
                    : status === "running"
                      ? "text-[#B4FF00] animate-pulse"
                      : status === "error"
                        ? "text-red-400"
                        : "text-white/65"
                }`}
              >
                {t(TIMELINE_LABEL_KEYS[tool] as "timeline_niche")}
                {status === "done" ? (
                  <span className="text-[#B4FF00] ml-1">✓</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
