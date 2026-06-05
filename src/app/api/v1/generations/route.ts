import { authenticateApiRequest, logApiRequest } from "@/app/api/v1/middleware";
import { listApiGenerations } from "@/lib/api-v1/generators";
import { apiError, apiSuccess } from "@/lib/api-v1/errors";

export async function GET(request: Request) {
  const start = Date.now();
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const type = url.searchParams.get("type") ?? undefined;

    const data = await listApiGenerations(auth.ctx.userId, {
      limit: Number.isFinite(limit) ? limit : 20,
      offset: Number.isFinite(offset) ? offset : 0,
      type: type ?? undefined,
    });

    await logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      userId: auth.ctx.userId,
      endpoint: "/api/v1/generations",
      creditsUsed: 0,
      responseTimeMs: Date.now() - start,
      statusCode: 200,
    });

    return apiSuccess(data);
  } catch {
    await logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      userId: auth.ctx.userId,
      endpoint: "/api/v1/generations",
      creditsUsed: 0,
      responseTimeMs: Date.now() - start,
      statusCode: 500,
    });
    return apiError(500, "Server error", "SERVER_ERROR");
  }
}
