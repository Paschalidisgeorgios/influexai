"use client";

import { DynamicDashboardEngine } from "@/components/dashboard/DynamicDashboardEngine";
import { AgentHandoffPanel } from "@/components/dashboard/studio-ui";
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
      {prepared ? (
        <div className="mx-auto mb-4 w-full min-w-0 max-w-5xl px-4 pt-2">
          <AgentHandoffPanel prepared={prepared} />
        </div>
      ) : null}
      <SzenenGeneratorStudio preparedInputs={prepared} />
    </DynamicDashboardEngine>
  );
}
