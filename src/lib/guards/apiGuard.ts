import { NextResponse } from "next/server";

import { requireActivePlan } from "./requireActivePlan";

export async function withPlanGuard(userId: string) {
  const hasPlan = await requireActivePlan(userId);

  if (!hasPlan) {
    return NextResponse.json(
      { error: "Kein aktives Paket. Bitte upgraden." },
      { status: 403 }
    );
  }

  return null;
}
