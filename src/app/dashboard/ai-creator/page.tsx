"use client";

import { DashboardOsModulePage } from "@/components/dashboard/core/DashboardOsModulePage";

export default function AiCreatorPage() {
  return (
    <DashboardOsModulePage
      kicker="AI Creator"
      title="Characters, Personas und Digital Twins vorbereiten"
      subtitle="Der zentrale Bereich für wiedererkennbare Creator-Identitäten — für UGC, Influencer-Visuals und konsistente Produktion."
      bullets={[
        "Characters und Personas anlegen oder vorbereiten",
        "Referenzbilder und Stilrichtung für konsistente Visuals sammeln",
        "UGC-Avatare und Digital-Twin-Workflows starten",
        "Training und Provider-Schritte nur dort, wo der Workflow es vorsieht — mit Consent-Hinweisen",
      ]}
      note="LoRA-Training und Provider-Uploads sind Teil einzelner Workflows, kein isoliertes Hauptprodukt. Demo-Referenzen sind keine trainierten Modelle."
      primaryCta={{ label: "Im Studio starten", href: "/dashboard" }}
      secondaryCta={{ label: "Zur Galerie", href: "/dashboard/gallery" }}
      links={[
        {
          label: "KI Influencer",
          description: "Character-Setup, Referenzen und Generierung für AI Influencer.",
          href: "/dashboard/ki-influencer",
        },
        {
          label: "Mein KI-Ich",
          description: "Digital Twin und Face-basierte Visuals vorbereiten.",
          href: "/dashboard/ki-ich",
        },
        {
          label: "Character Studio",
          description: "Character Swap und Video-Identitäten in bestehenden Workflows.",
          href: "/dashboard/character-studio",
        },
        {
          label: "LoRA Training",
          description: "Training-Workflow — nur wenn dein Plan und der Provider-Schritt aktiv sind.",
          href: "/dashboard/lora-training",
        },
      ]}
    />
  );
}
