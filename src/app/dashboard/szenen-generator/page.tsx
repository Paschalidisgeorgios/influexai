"use client";

import { DynamicDashboardEngine } from "@/components/dashboard/DynamicDashboardEngine";
import { SzenenGeneratorStudio } from "@/components/szenen-generator/SzenenGeneratorStudio";

export default function SzenenGeneratorPage() {
  return (
    <DynamicDashboardEngine toolId="szenen-generator" hideModelPanel className="min-h-[calc(100dvh-120px)]">
      <SzenenGeneratorStudio />
    </DynamicDashboardEngine>
  );
}
