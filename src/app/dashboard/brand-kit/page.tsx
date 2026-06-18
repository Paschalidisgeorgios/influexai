"use client";

import { DashboardOsModulePage } from "@/components/dashboard/core/DashboardOsModulePage";

export default function BrandKitPage() {
  return (
    <DashboardOsModulePage
      kicker="Brand Kit"
      title="Markenregeln für wiederholbare Workflows"
      subtitle="Hinterlege Markenstimme, Referenzen und Produktinfos — damit Workflows konsistenter starten."
      bullets={[
        "Markenstimme, Tonalität und Zielgruppen festhalten",
        "Farben, Referenzen und Produktinfos bündeln",
        "Wiederverwendbare Regeln für Studio-Workflows vorbereiten",
        "Schrittweise Integration in Agent und Workflows — nicht alles ist bereits automatisch aktiv",
      ]}
      primaryCta={{ label: "Im Studio starten", href: "/dashboard" }}
      secondaryCta={{ label: "Einstellungen öffnen", href: "/dashboard/settings" }}
    />
  );
}
