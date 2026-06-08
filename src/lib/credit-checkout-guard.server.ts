import "server-only";

import { NextResponse } from "next/server";
import { hasActivePlan, type AccessUser } from "@/lib/access";
import { isPlatformAdminServer } from "@/lib/platform-admin.server";

export const PLAN_REQUIRED_FOR_CREDITS_MESSAGE =
  "Bitte wähle zuerst ein Paket, bevor du Credits kaufst.";

export function denyPlatformCreditCheckoutResponse(): NextResponse {
  return NextResponse.json(
    {
      error: PLAN_REQUIRED_FOR_CREDITS_MESSAGE,
      code: "PLAN_REQUIRED_FOR_CREDITS",
    },
    { status: 403 }
  );
}

/** Platform credit packs require profiles.plan (agency_plan does not count). */
export function assertPlatformPlanForCreditCheckout(
  user: { email?: string | null },
  profile: {
    plan?: string | null;
    role?: string | null;
    is_admin?: boolean | null;
  } | null
): NextResponse | null {
  const accessUser: AccessUser = {
    email: user.email,
    plan: profile?.plan,
    role: profile?.role,
    is_admin: profile?.is_admin,
  };

  if (isPlatformAdminServer(accessUser) || hasActivePlan(accessUser)) {
    return null;
  }

  return denyPlatformCreditCheckoutResponse();
}
