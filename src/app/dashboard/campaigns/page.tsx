"use client";

import { DashboardOsModulePage } from "@/components/dashboard/core/DashboardOsModulePage";

export default function CampaignsPage() {
  return (
    <DashboardOsModulePage
      kicker="Kampagnen"
      title="Kampagnen aus deinen Assets aufbauen"
      subtitle="Kampagnen werden hier aus deiner Galerie vorbereitet — mit Hooks, Creatives und Varianten für mehrere Plattformen."
      bullets={[
        "Assets aus der Galerie als Ausgangspunkt wählen",
        "Hooks, Captions und Varianten für Social vorbereiten",
        "Später Kampagnenplan und Creative-Sets bündeln",
        "Keine vollautomatische Ausspielung — Fokus auf Vorbereitung und Struktur",
      ]}
      primaryCta={{ label: "Zur Galerie", href: "/dashboard/gallery" }}
      secondaryCta={{ label: "Im Studio starten", href: "/dashboard" }}
      links={[
        {
          label: "Campaign Autopilot",
          description: "Bestehender Workflow für Kampagnen-Briefings und Content-Planung.",
          href: "/dashboard/campaign-autopilot",
        },
        {
          label: "Content-Kalender",
          description: "Redaktionsplanung und Content-Slots vorbereiten.",
          href: "/dashboard/content-kalender",
        },
      ]}
    />
  );
}
