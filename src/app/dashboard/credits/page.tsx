"use client";

import {
  DashboardPageHeader,
} from "@/components/dashboard/core/DashboardSurface";
import { StudioCreditsSection } from "@/components/dashboard/core/StudioCreditsSection";

export default function CreditsPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl">
      <DashboardPageHeader
        title="Credits"
        subtitle="Guthaben, Verbrauch und Credit-Pakete verwalten."
      />
      <StudioCreditsSection showPackages showApi />
    </div>
  );
}
