import "server-only";

import { NextRequest, NextResponse } from "next/server";

export async function postViaDeprecatedRoute(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  canonicalPath: string
): Promise<NextResponse> {
  const response = await handler(request);
  response.headers.set("X-Deprecated-Route", canonicalPath);
  return response;
}
