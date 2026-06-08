import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { POST as creditsCheckoutPost } from "@/app/api/credits/checkout/route";
import { postViaDeprecatedRoute } from "@/lib/deprecated-api-route.server";
import {
  DEFAULT_CHECKOUT_PACKAGE,
  getPackageById,
} from "@/lib/credit-packages";
import {
  isWhitelistedCreditPriceId,
  packageForStripePriceId,
} from "@/lib/stripe-credit-prices";

type LegacyCreditCheckoutBody = Record<string, unknown>;

const CANONICAL_CREDITS_CHECKOUT = "/api/credits/checkout";

function deprecatedErrorResponse(error: string, status = 400): NextResponse {
  return NextResponse.json(
    { error },
    {
      status,
      headers: { "X-Deprecated-Route": CANONICAL_CREDITS_CHECKOUT },
    }
  );
}

export function normalizeLegacyCreditCheckoutBody(
  body: LegacyCreditCheckoutBody,
  options?: { allowDefaultPackage?: boolean }
): { body: Record<string, unknown> } | { error: string } {
  const packageIdRaw =
    typeof body.packageId === "string"
      ? body.packageId.trim()
      : typeof body.package === "string"
        ? body.package.trim()
        : "";

  if (packageIdRaw) {
    if (!getPackageById(packageIdRaw)) {
      return { error: "Ungültiges Paket" };
    }
    return { body: { packageId: packageIdRaw } };
  }

  const priceId =
    typeof body.priceId === "string" ? body.priceId.trim() : "";
  const mode =
    typeof body.mode === "string" ? body.mode.trim().toLowerCase() : "";

  if (priceId && mode && mode !== "payment") {
    return {
      error:
        "Unsupported checkout mode. Use mode: payment for credit packs or packageId.",
    };
  }

  if (priceId) {
    const creditsRaw = body.credits;
    const credits =
      typeof creditsRaw === "number"
        ? creditsRaw
        : typeof creditsRaw === "string"
          ? parseInt(creditsRaw, 10)
          : NaN;

    if (Number.isFinite(credits) && credits > 0) {
      if (!isWhitelistedCreditPriceId(priceId)) {
        return { error: "Ungültige Price ID" };
      }
      const pkg = packageForStripePriceId(priceId);
      if (!pkg || pkg.credits !== credits) {
        return { error: "Ungültiges Paket" };
      }
      return { body: { priceId, credits } };
    }

    if (!isWhitelistedCreditPriceId(priceId)) {
      return { error: "Ungültige Price ID" };
    }
    const pkg = packageForStripePriceId(priceId);
    if (!pkg) {
      return { error: "Paket nicht gefunden" };
    }
    return { body: { packageId: pkg.id } };
  }

  if (options?.allowDefaultPackage) {
    return { body: { packageId: DEFAULT_CHECKOUT_PACKAGE } };
  }

  return { error: "packageId oder priceId erforderlich" };
}

export async function postLegacyCreditCheckoutViaCanonical(
  request: NextRequest,
  options?: { allowDefaultPackage?: boolean }
): Promise<NextResponse> {
  let body: LegacyCreditCheckoutBody;
  try {
    body = (await request.json()) as LegacyCreditCheckoutBody;
  } catch {
    return deprecatedErrorResponse("Invalid JSON");
  }

  const normalized = normalizeLegacyCreditCheckoutBody(body, options);
  if ("error" in normalized) {
    return deprecatedErrorResponse(normalized.error);
  }

  const proxied = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(normalized.body),
  });

  return postViaDeprecatedRoute(
    proxied,
    creditsCheckoutPost,
    CANONICAL_CREDITS_CHECKOUT
  );
}
