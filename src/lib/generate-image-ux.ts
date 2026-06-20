import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";

export const GENERATE_IMAGE_STANDARD_CREDITS = 5;

export const GENERATE_IMAGE_CREDIT_PILL_LABEL = "5 Credits pro Bild";

export const GENERATE_IMAGE_QUALITY_HINT =
  "Standardqualität · kampagnenbereit";

export const GENERATE_IMAGE_PROVIDER_DISABLED_CODE = "PROVIDERS_DISABLED";

export const GENERATE_IMAGE_MODEL_HINT =
  "Premium-Bildmodell · optimiert für Kampagnenvisuals";

export const GENERATE_IMAGE_PROVIDER_DISABLED_MESSAGE =
  "Bildgenerierung ist in dieser Umgebung deaktiviert. Es werden keine externen KI-Provider aufgerufen.";

export const GENERATE_IMAGE_CREDIT_REFUND_HINT =
  "Wenn die Generierung nicht erfolgreich abgeschlossen wird, werden Credits nicht endgültig belastet bzw. automatisch korrigiert.";

export const GENERATE_IMAGE_CANONICAL_ROUTE = "/dashboard/image-generator";

export function getGenerateImageCreditCost(highRes = false): number {
  return highRes ? IMAGE_GEN_CREDITS.highRes : IMAGE_GEN_CREDITS.standard;
}

export function formatGenerateImageCreditsPerImage(credits: number): string {
  return `${credits} Credits pro Bild`;
}

export function getGenerateImageCreditPillLabel(highRes = false): string {
  return highRes
    ? formatGenerateImageCreditsPerImage(IMAGE_GEN_CREDITS.highRes)
    : GENERATE_IMAGE_CREDIT_PILL_LABEL;
}

export function getGenerateImageCtaLabel(highRes = false): string {
  const credits = getGenerateImageCreditCost(highRes);
  return `Bild generieren — ${credits} Credits`;
}

export function isProvidersDisabledForGenerateImageClient(): boolean {
  const flag = process.env.NEXT_PUBLIC_PROVIDERS_DISABLED?.trim().toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

export function isProviderDisabledApiResponse(
  status: number,
  data?: { code?: string; error?: string }
): boolean {
  if (status !== 503) return false;
  const code = data?.code ?? "";
  const error = data?.error ?? "";
  return (
    code === GENERATE_IMAGE_PROVIDER_DISABLED_CODE ||
    /provider.*deaktiviert|providers_disabled/i.test(error)
  );
}

export function mapGenerateImageApiError(
  status: number,
  data?: { code?: string; error?: string }
): {
  message: string;
  showRefundHint: boolean;
  isProviderDisabled: boolean;
} {
  if (isProviderDisabledApiResponse(status, data)) {
    return {
      message: GENERATE_IMAGE_PROVIDER_DISABLED_MESSAGE,
      showRefundHint: false,
      isProviderDisabled: true,
    };
  }

  if (status === 401) {
    return {
      message: "Bitte melde dich an, um Bilder zu generieren.",
      showRefundHint: false,
      isProviderDisabled: false,
    };
  }

  if (status === 403) {
    return {
      message:
        data?.error ??
        "Zugriff nicht möglich. Prüfe Plan oder Berechtigung unter Einstellungen.",
      showRefundHint: false,
      isProviderDisabled: false,
    };
  }

  if (status === 402 || data?.error === "insufficient_credits") {
    return {
      message: "Nicht genug Credits für diese Generierung.",
      showRefundHint: false,
      isProviderDisabled: false,
    };
  }

  return {
    message: data?.error ?? "Generierung fehlgeschlagen.",
    showRefundHint: status >= 500,
    isProviderDisabled: false,
  };
}

export function formatCreditsUsedLabel(
  creditsUsed: number | undefined,
  creditExempt?: boolean
): string | null {
  if (creditExempt) return null;
  if (typeof creditsUsed !== "number" || creditsUsed <= 0) return null;
  return `${creditsUsed} Credits verwendet`;
}

export function formatCreditsLeftLabel(creditsLeft: number | undefined): string | null {
  if (typeof creditsLeft !== "number" || creditsLeft < 0) return null;
  return `Verbleibend: ${creditsLeft} Credits`;
}
