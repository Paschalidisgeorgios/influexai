import {
  FEATURES,
  NICHES,
  type FeatureKey,
  type NicheKey,
} from "@/lib/programmatic-seo";
import type { GuideFaq } from "./types";

export function getToolFaqs(feature: FeatureKey, niche: NicheKey): GuideFaq[] {
  const f = FEATURES[feature];
  const n = NICHES[niche];

  return [
    {
      question: `Wie nutze ich ${f.nameDe} für ${n.nameDe} Content?`,
      answer: `Mit dem InfluexAI ${f.nameDe} gibst du dein Thema aus der ${n.nameDe}-Nische ein — z. B. „${n.examples[0]}“. Die KI liefert in Sekunden ein umsetzbares Ergebnis (${f.creditCost} Credits), das du an deinen Stil anpasst und direkt veröffentlichst.`,
    },
    {
      question: `Was macht guten ${n.nameDe} Short Content aus?`,
      answer: `Starke ${n.nameDe}-Shorts beginnen mit einem klaren Hook, liefern in unter 60 Sekunden einen konkreten Mehrwert und enden mit einem CTA. Formate wie „${n.examples[1]}“ funktionieren besonders gut, wenn du sie wöchentlich variierst.`,
    },
    {
      question: `Wie lange dauert die Erstellung mit ${f.nameDe}?`,
      answer: `Die Generierung dauert meist unter 30 Sekunden. Die gesparte Zeit liegt in Recherche und Struktur — typisch 1–2 Stunden pro Video. So kannst du 3–5 ${n.nameDe}-Shorts pro Woche planen.`,
    },
    {
      question: `Brauche ich Vorerfahrung in ${n.name}?`,
      answer: `Nein. Der ${f.nameDe} ist für Einsteiger und Fortgeschrittene gebaut. Du brauchst ein klares Thema und deine Perspektive — InfluexAI liefert Struktur, du lieferst Authentizität.`,
    },
  ];
}
