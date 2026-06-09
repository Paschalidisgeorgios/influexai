"use client";

import { useTranslations } from "next-intl";
import { MasterAgentChat } from "@/components/agent/MasterAgentChat";
import { DashboardCheckoutSuccess } from "@/components/credits/DashboardCheckoutSuccess";

export default function DashboardPage() {
  const t = useTranslations("agent");

  const featuredPrompts = [
    t("example_prompt_1"),
    t("example_prompt_2"),
    t("example_prompt_3"),
  ];

  const chipGroups = [
    {
      label: t("group_quick_start"),
      chips: [t("chip_script"), t("chip_generate_image"), t("chip_product_ad")],
    },
    {
      label: t("group_creator"),
      chips: [t("chip_ugc_creator"), t("chip_faceless"), t("chip_generate_video")],
    },
    {
      label: t("group_analyze"),
      chips: [t("chip_channel_analyze"), t("chip_viral_score")],
    },
  ];

  return (
    <div className="flex flex-1 flex-col min-h-0 w-full min-w-0 max-w-4xl mx-auto overflow-x-hidden">
      <DashboardCheckoutSuccess />
      <MasterAgentChat featuredPrompts={featuredPrompts} chipGroups={chipGroups} />
    </div>
  );
}
