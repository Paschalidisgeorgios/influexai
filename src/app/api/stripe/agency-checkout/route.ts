import { NextRequest } from "next/server";

import { POST as agencyCheckoutPost } from "@/app/api/agency/checkout/route";
import { postViaDeprecatedRoute } from "@/lib/deprecated-api-route.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/agency/checkout */
export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  return postViaDeprecatedRoute(
    request,
    agencyCheckoutPost,
    "/api/agency/checkout"
  );
}
