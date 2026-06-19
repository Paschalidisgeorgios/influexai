import "server-only";

import { NextResponse } from "next/server";
import { hasPaidBillingPlan, type AccessUser } from "@/lib/access";
import { CHECKOUT_USER_MESSAGES } from "@/lib/checkout-messages";

export const PLAN_REQUIRED_FOR_CREDITS_MESSAGE =
  CHECKOUT_USER_MESSAGES.planRequired;

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

  if (hasPaidBillingPlan(accessUser)) {
    return null;
  }

  return denyPlatformCreditCheckoutResponse();
}
