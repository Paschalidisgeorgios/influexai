import { type NextRequest, NextResponse } from "next/server";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  console.warn(
    "[api/ki-agent] Legacy POST endpoint — transparent rewrite to /api/agent"
  );

  return NextResponse.rewrite(new URL("/api/agent", request.url));
}
