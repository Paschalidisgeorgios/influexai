export type FeatureTutorial = {
  id: string;
  titleKey: string;
  descKey: string;
  href: string;
  steps: string[];
  videoLabel?: string;
};

export const FEATURE_TUTORIALS: FeatureTutorial[] = [
  {
    id: "script-generator",
    titleKey: "script_generator_title",
    descKey: "script_generator_desc",
    href: "/dashboard/script-generator",
    videoLabel: "Video",
    steps: [
      "Thema oder Hook eingeben (z. B. Nische + Zielgruppe)",
      "Ton & Länge wählen — Shorts-Format empfohlen",
      "Script generieren und Abschnitte anpassen",
      "Als Vorlage speichern oder direkt ins Video-Modul übernehmen",
    ],
  },
  {
    id: "lora-training",
    titleKey: "lora_training_title",
    descKey: "lora_training_desc",
    href: "/dashboard/lora-training",
    videoLabel: "Video",
    steps: [
      "10–20 Referenzbilder hochladen (gleiche Person, verschiedene Posen)",
      "LoRA-Typ wählen (Portrait oder Fast Trainer)",
      "Training starten — Fortschritt im Dashboard verfolgen",
      "Fertiges Modell im Bild-Generator mit Trigger-Word nutzen",
    ],
  },
  {
    id: "niche-analyzer",
    titleKey: "niche_analyzer_title",
    descKey: "niche_analyzer_desc",
    href: "/dashboard/niche-analyzer",
    steps: [
      "Nische oder Keyword eingeben",
      "KI analysiert Trends und Wettbewerb",
      "Top-Ideen und Metriken vergleichen",
      "Beste Idee als Script oder Content planen",
    ],
  },
  {
    id: "product-ad",
    titleKey: "product_ad_title",
    descKey: "product_ad_desc",
    href: "/dashboard/product-ad",
    steps: [
      "Produktbild und Zielgruppe angeben",
      "Plattform & Stil wählen (TikTok, Reels, …)",
      "Script prüfen und Video generieren",
      "Varianten testen und exportieren",
    ],
  },
  {
    id: "live-creator",
    titleKey: "live_creator_title",
    descKey: "live_creator_desc",
    href: "/dashboard/live-creator",
    steps: [
      "Avatar-Bild und Stimme auswählen",
      "Script einfügen oder generieren",
      "Talking-Video starten und Status abwarten",
      "Fertiges Video herunterladen oder weiterbearbeiten",
    ],
  },
  {
    id: "thumbnail",
    titleKey: "thumbnail_title",
    descKey: "thumbnail_desc",
    href: "/dashboard/thumbnail-concept",
    steps: [
      "Video-Titel und Stimmung beschreiben",
      "Konzept-Varianten generieren",
      "Bestes Layout für CTR auswählen",
      "Export für YouTube / Shorts",
    ],
  },
];
