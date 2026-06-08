import { NextRequest } from "next/server";

import { postLegacyCreditCheckoutViaCanonical } from "@/lib/legacy-credit-checkout.server";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/credits/checkout */
export async function POST(request: NextRequest) {
  return postLegacyCreditCheckoutViaCanonical(request, {
    allowDefaultPackage: true,
  });
}
