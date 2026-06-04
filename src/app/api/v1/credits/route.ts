import { authenticateApiRequest, logApiRequest } from "@/app/api/v1/middleware";
import { getApiCreditsInfo } from "@/lib/api-v1/generators";
import { apiError } from "@/lib/api-v1/errors";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const start = Date.now();
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const info = await getApiCreditsInfo(auth.ctx.userId);
    await logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      userId: auth.ctx.userId,
      endpoint: "/api/v1/credits",
      creditsUsed: 0,
      responseTimeMs: Date.now() - start,
      statusCode: 200,
    });
    return NextResponse.json(info);
  } catch {
    await logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      userId: auth.ctx.userId,
      endpoint: "/api/v1/credits",
      creditsUsed: 0,
      responseTimeMs: Date.now() - start,
      statusCode: 500,
    });
    return apiError(500, "Server error", "SERVER_ERROR");
  }
}
