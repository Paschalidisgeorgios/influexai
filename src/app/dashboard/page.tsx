"use client";

import { useTranslations } from "next-intl";
import { MasterAgentChat } from "@/components/agent/MasterAgentChat";

export default function DashboardPage() {
  const t = useTranslations("agent");

  const suggestedPrompts = [
    t("chip_ugc_creator"),
    t("chip_faceless"),
    t("chip_product_ad"),
    t("chip_script"),
    t("chip_channel_analyze"),
    t("chip_viral_score"),
    t("chip_generate_image"),
    t("chip_generate_video"),
  ];

  return (
    <div className="flex flex-col min-h-[280px] h-[calc(100dvh-11rem-env(safe-area-inset-bottom,0px))] lg:h-[calc(100dvh-10.5rem)] w-full min-w-0 max-w-4xl mx-auto">
      <MasterAgentChat suggestedPrompts={suggestedPrompts} />
    </div>
  );
}
