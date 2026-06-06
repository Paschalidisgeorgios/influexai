"use client";

import {
  handleGenerationCreditError,
  notifyGenerationComplete,
} from "@/lib/client-credits-ui";

type CreditErrorResult = {
  success: false;
  error: string;
  credits?: number;
  required?: number;
};

type SuccessResult = {
  success: true;
  creditsLeft?: number;
};

export function onGenerationActionResult(
  res: CreditErrorResult | SuccessResult
): boolean {
  if (res.success) {
    if (typeof res.creditsLeft === "number") {
      notifyGenerationComplete(res.creditsLeft);
    } else {
      window.dispatchEvent(new Event("credits-updated"));
    }
    return true;
  }

  handleGenerationCreditError(res);
  return false;
}

export { shouldShowInlineGenerationError } from "@/lib/client-credits-ui";
