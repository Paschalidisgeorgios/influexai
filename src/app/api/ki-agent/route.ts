import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.warn(
    "[api/ki-agent] Legacy POST endpoint — transparent rewrite to /api/agent"
  );

  return NextResponse.rewrite(new URL("/api/agent", request.url));
}
