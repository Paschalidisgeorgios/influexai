import { authenticateApiRequest, logApiRequest } from "@/app/api/v1/middleware";
import { apiError, apiSuccess } from "@/lib/api-v1/errors";
import type { ApiGenResult } from "@/lib/api-v1/generators";

export async function handleApiPost<T>(
  request: Request,
  endpoint: string,
  run: (
    userId: string,
    body: Record<string, unknown>
  ) => Promise<ApiGenResult<T>>
) {
  const start = Date.now();
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  let statusCode = 200;
  let creditsUsed = 0;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await run(auth.ctx.userId, body);

    if (!result.ok) {
      statusCode = 402;
      await logApiRequest({
        apiKeyId: auth.ctx.apiKeyId,
        userId: auth.ctx.userId,
        endpoint,
        creditsUsed: 0,
        responseTimeMs: Date.now() - start,
        statusCode,
      });
      return apiError(402, result.error, "INSUFFICIENT_CREDITS", {
        credits_remaining: result.creditsRemaining,
      });
    }

    creditsUsed = result.creditsUsed;
    await logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      userId: auth.ctx.userId,
      endpoint,
      creditsUsed,
      responseTimeMs: Date.now() - start,
      statusCode,
    });

    return apiSuccess(result.data, {
      credits_used: result.creditsUsed,
      credits_remaining: result.creditsRemaining,
    });
  } catch (e) {
    statusCode =
      e instanceof Error && e.message.startsWith("INVALID") ? 400 : 500;
    await logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      userId: auth.ctx.userId,
      endpoint,
      creditsUsed: 0,
      responseTimeMs: Date.now() - start,
      statusCode,
    });
    if (statusCode === 400) {
      return apiError(400, "Invalid request body", "INVALID_REQUEST");
    }
    return apiError(500, "Server error", "SERVER_ERROR");
  }
}

export async function handleApiGet(
  request: Request,
  endpoint: string,
  run: (userId: string) => Promise<Record<string, unknown>>
) {
  const start = Date.now();
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const data = await run(auth.ctx.userId);
    await logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      userId: auth.ctx.userId,
      endpoint,
      creditsUsed: 0,
      responseTimeMs: Date.now() - start,
      statusCode: 200,
    });
    return apiSuccess(data);
  } catch {
    await logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      userId: auth.ctx.userId,
      endpoint,
      creditsUsed: 0,
      responseTimeMs: Date.now() - start,
      statusCode: 500,
    });
    return apiError(500, "Server error", "SERVER_ERROR");
  }
}
