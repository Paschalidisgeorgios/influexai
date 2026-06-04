"use client";

import { useTranslations } from "next-intl";
import { MasterAgentChat } from "@/components/agent/MasterAgentChat";

export default function MasterAgentPage() {
  const t = useTranslations("agent");

  const suggestedPrompts = [
    t("chip_niche_video"),
    t("chip_plan_three"),
    t("chip_competitor"),
    t("chip_viral_score"),
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100vh-80px)] w-full max-w-6xl mx-auto min-h-0">
      <MasterAgentChat suggestedPrompts={suggestedPrompts} />
    </div>
  );
}
