"use client";

import { AiCreatorWorkflow } from "@/components/dashboard/ai-creator/AiCreatorWorkflow";
import "@/components/dashboard/ai-creator/ai-creator.css";

export default function AiCreatorDashboardPage() {
  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 py-8 md:px-8">
      <AiCreatorWorkflow lang="de" preview={false} classPrefix="dashboard" />
    </div>
  );
}
