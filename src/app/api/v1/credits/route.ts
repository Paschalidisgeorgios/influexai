import { authenticateApiRequest, logApiRequest } from "@/app/api/v1/middleware";
import { getApiMeInfo } from "@/lib/api-v1/generators";
import { apiError, apiSuccess } from "@/lib/api-v1/errors";

/** @deprecated Prefer GET /api/v1/me */
export async function GET(request: Request) {
  const start = Date.now();
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const me = await getApiMeInfo(auth.ctx.userId);
    await logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      userId: auth.ctx.userId,
      endpoint: "/api/v1/credits",
      creditsUsed: 0,
      responseTimeMs: Date.now() - start,
      statusCode: 200,
    });
    return apiSuccess({
      credits_remaining: me.credits_remaining,
      credits_used_this_month: me.credits_used_this_month,
    });
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
