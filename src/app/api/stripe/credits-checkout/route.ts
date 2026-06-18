import { NextRequest } from "next/server";

import { postLegacyCreditCheckoutViaCanonical } from "@/lib/legacy-credit-checkout.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/credits/checkout */
export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  return postLegacyCreditCheckoutViaCanonical(request);
}
