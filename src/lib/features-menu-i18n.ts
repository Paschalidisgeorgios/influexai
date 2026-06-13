"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { FEATURES_MENU_FALLBACK_DE } from "@/lib/features-menu-fallback-de";

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function isMissingTranslation(value: string, key: string): boolean {
  if (!value || value === key) return true;
  if (value.includes("landingPage.") || value.includes("featuresMenu.")) return true;
  const last = key.split(".").pop();
  if (last && value === last && key.includes(".")) return true;
  return false;
}

function resolveLabel(
  translate: (key: string) => string,
  root: Record<string, unknown>,
  key: string
): string {
  try {
    const value = translate(key);
    if (isMissingTranslation(value, key)) {
      return getNested(root, key) ?? value;
    }
    return value;
  } catch {
    return getNested(root, key) ?? key;
  }
}

export function useFeaturesMenuLabel() {
  const t = useTranslations("landingPage.featuresMenu");
  const tPromo = useTranslations("landingPage.featuresMenu.promo");

  const label = useCallback(
    (key: string) => resolveLabel(t, FEATURES_MENU_FALLBACK_DE, key),
    [t]
  );

  const promo = useCallback(
    (key: string) =>
      resolveLabel(
        tPromo,
        FEATURES_MENU_FALLBACK_DE.promo as Record<string, unknown>,
        key
      ),
    [tPromo]
  );

  return { label, promo };
}

/** Static German nav labels when landingPage keys are missing */
export const NAV_LABELS_DE = {
  features: "Features",
  workflows: "Workflows",
  brands: "Für Brands",
  agency: "Agenturen",
  pricing: "Preise",
  dashboard: "Dashboard",
  login: "Login",
  signup: "Studio starten",
  menuOpen: "Menü öffnen",
  menuClose: "Menü schließen",
} as const;
