"use client";

import { DynamicDashboardEngine } from "@/components/dashboard/DynamicDashboardEngine";
import { SzenenGeneratorStudio } from "@/components/szenen-generator/SzenenGeneratorStudio";
import { useAgentPreparedInputs } from "@/hooks/useAgentPreparedInputs";

export default function SzenenGeneratorPage() {
  const prepared = useAgentPreparedInputs("img-to-video");

  return (
    <DynamicDashboardEngine
      toolId="szenen-generator"
      hideModelPanel
      className="min-h-[calc(100dvh-120px)]"
    >
      <SzenenGeneratorStudio preparedInputs={prepared} />
    </DynamicDashboardEngine>
  );
}
