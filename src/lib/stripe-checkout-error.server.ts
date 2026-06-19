import "server-only";

import { NextResponse } from "next/server";
import {
  CHECKOUT_ERROR_CODES,
  CHECKOUT_USER_MESSAGES,
} from "@/lib/checkout-messages";

export function isStripeMissingPriceError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; param?: string; type?: string };
  if (err.code !== "resource_missing") return false;
  return (err.param ?? "").includes("price");
}

export function stripeMissingPriceErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      error: CHECKOUT_USER_MESSAGES.missingConfig,
      code: CHECKOUT_ERROR_CODES.missingPriceId,
    },
    { status: 503 }
  );
}

export function resolveStripeCheckoutRouteError(error: unknown): NextResponse | null {
  if (isStripeMissingPriceError(error)) {
    return stripeMissingPriceErrorResponse();
  }
  return null;
}
