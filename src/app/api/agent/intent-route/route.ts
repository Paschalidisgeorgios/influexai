import { NextRequest, NextResponse } from "next/server";
import { routeIntent } from "@/lib/agent/intentRouter";
import { assertActivePlan } from "@/lib/access.server";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  const denied = await assertActivePlan();
  if (denied) return denied;

  let body: { input?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = body.input?.trim() ?? "";
  if (!input) {
    return NextResponse.json(
      { tool: "ki-agent", prefill: {}, confidence: 0 },
      { status: 200 }
    );
  }

  const result = await routeIntent(input);
  console.log(
    "[intent-router]",
    input.slice(0, 50),
    result.tool,
    result.confidence
  );

  return NextResponse.json(result);
}
