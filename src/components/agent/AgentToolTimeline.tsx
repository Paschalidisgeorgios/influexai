"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import type { AgentToolName } from "@/lib/agent/types";
import { AGENT_TOOL_STEP_LABELS } from "@/lib/agent/tools-definition";
import { AGENT_TOOL_WORKING_LABELS } from "@/lib/agent/tool-labels";

const TIMELINE_LABEL_KEYS: Partial<Record<AgentToolName, string>> = {
  analyze_niche: "timeline_niche",
  detect_outlier: "timeline_outliers",
  generate_script: "timeline_script",
  generate_thumbnail: "timeline_thumbnail",
  viral_score: "timeline_viral",
  analyze_competitor: "timeline_competitor",
  generate_image: "timeline_image",
  generate_video_from_image: "timeline_video",
  ugc_video: "timeline_ugc",
  produkt_werbung: "timeline_produkt",
  avatar_video: "timeline_avatar",
  video_remix: "timeline_remix",
  stimme_musik: "timeline_voice",
  live_creator: "timeline_live",
};

type StepState = {
  tool: AgentToolName;
  label?: string;
  status: "pending" | "running" | "done" | "error";
};

type Props = {
  steps: StepState[];
};

export function AgentToolTimeline({ steps }: Props) {
  const t = useTranslations("agent");

  const labelFor = (step: StepState) => {
    if (step.label) return step.label;
    const key = TIMELINE_LABEL_KEYS[step.tool];
    return key ? t(key as "timeline_niche") : AGENT_TOOL_STEP_LABELS[step.tool];
  };

  if (steps.length === 0) return null;

  return (
    <nav
      className="shrink-0 w-full md:w-52 lg:w-56 pr-0 md:pr-6"
      aria-label={t("timeline_label")}
    >
      <ul className="flex md:flex-col gap-4 md:gap-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 snap-x md:snap-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((step, index) => {
          const status = step.status;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={`${step.tool}-${index}`}
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
                {labelFor(step)}
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

export function AgentToolStepCards({
  steps,
}: {
  steps: { tool: AgentToolName; label: string; status: string }[];
}) {
  if (steps.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {steps.map((step) => {
        const displayLabel =
          step.status === "running"
            ? AGENT_TOOL_WORKING_LABELS[step.tool] ?? step.label
            : step.label;

        return (
        <div
          key={step.tool}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${
            step.status === "done"
              ? "border-[var(--accent,#B4FF00)]/25 bg-[var(--accent,#B4FF00)]/5 text-white/75"
              : step.status === "running"
                ? "border-[var(--accent,#B4FF00)]/40 bg-[var(--accent,#B4FF00)]/10 text-[var(--accent,#B4FF00)]"
                : step.status === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : "border-white/10 bg-white/[0.02] text-white/50"
          }`}
        >
          {step.status === "running" ? (
            <Loader2 size={14} className="shrink-0 animate-spin" />
          ) : null}
          <span className="flex-1">{displayLabel}</span>
          {step.status === "done" ? (
            <span className="text-[var(--accent,#B4FF00)]">✓</span>
          ) : null}
        </div>
        );
      })}
    </div>
  );
}
