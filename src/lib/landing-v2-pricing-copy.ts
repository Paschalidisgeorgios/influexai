/** Pricing preview — editorial copy (DE), prices from subscription-plans.ts */

import type { SubscriptionPlanId } from "@/lib/subscription-plans";

export const LANDING_V2_PRICING_PREVIEW_HREF = "/design/pricing-preview" as const;

type PaidPlanId = Exclude<SubscriptionPlanId, "free">;

export const LANDING_V2_PRICING_COPY = {
  previewBanner: "Interne Pricing-Vorschau — Live-Preise unter /pricing",
  nav: {
    back: "Landing Preview",
    cta: "Studio starten",
  },
  hero: {
    eyebrow: "Preise",
    headline: "Pläne für dein Produktionsvolumen.",
    subline:
      "Starte klein, teste Workflows und erweitere dein Studio, wenn du regelmäßig Bilder, Videos oder Kampagnen-Assets produzierst.",
  },
  billing: {
    monthly: "Monatlich",
    yearly: "Jährlich",
    yearlyDiscountLabel: "−20%",
    perMonth: "/Monat",
    cancelAnytime: "Monatlich kündbar",
    billedYearly: "jährlich abgerechnet",
  },
  plans: {
    recommended: "Empfohlen",
    cta: "Plan auswählen",
    names: {
      starter: "Starter",
      creator: "Creator",
      pro: "Pro",
      business: "Business",
    } satisfies Record<PaidPlanId, string>,
    descriptions: {
      starter: "Für erste Tests und gelegentliche Inhalte.",
      creator: "Für regelmäßige Content-Produktion mit Visuals, Video und Agent.",
      pro: "Für professionelle Workflows mit Avatar, Stimme, LoRA und höherer Qualität.",
      business: "Für Teams, Marken und Agenturen mit mehr Volumen und erweiterten Funktionen.",
    } satisfies Record<PaidPlanId, string>,
  },
  credits: {
    title: "Wie Credits funktionieren",
    body:
      "Credits werden je nach Tool und Modell verbraucht. Text-, Bild-, Video- und Premium-Workflows können unterschiedlich viele Credits benötigen.",
    footnote: "Credits verfallen nicht. Nachladung erfordert einen aktiven Plan.",
  },
  faq: {
    eyebrow: "Hinweise",
    items: [
      {
        question: "Monatlich kündbar?",
        answer: "Ja — monatliche Pläne sind monatlich kündbar.",
      },
      {
        question: "Was ist im Plan enthalten?",
        answer:
          "Jeder Plan enthält monatliche Credits sowie Zugang zu den im Plan aufgeführten Tools und Workflows.",
      },
      {
        question: "Jährliche Abrechnung",
        answer:
          "Bei jährlicher Zahlung gilt der reduzierte Monatspreis — abgerechnet wird der Jahresbetrag.",
      },
      {
        question: "Extra-Credits",
        answer:
          "Zusätzliche Credits können nachladen — erfordert einen aktiven InfluexAI-Plan.",
      },
    ],
  },
  finalCta: {
    headline: "Starte mit dem Plan, der zu deinem Workflow passt.",
    ctaPrimary: "Studio starten",
    ctaSecondary: "Zur Landing Preview",
  },
} as const;
