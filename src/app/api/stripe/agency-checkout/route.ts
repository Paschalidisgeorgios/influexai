import { NextRequest } from "next/server";

import { POST as agencyCheckoutPost } from "@/app/api/agency/checkout/route";
import { postViaDeprecatedRoute } from "@/lib/deprecated-api-route.server";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/agency/checkout */
export async function POST(request: NextRequest) {
  return postViaDeprecatedRoute(
    request,
    agencyCheckoutPost,
    "/api/agency/checkout"
  );
}
