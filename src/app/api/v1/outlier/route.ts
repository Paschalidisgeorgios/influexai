import { apiDetectOutliers } from "@/lib/api-v1/generators";
import { handleApiPost } from "@/lib/api-v1/handle-route";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export async function POST(request: Request) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  return handleApiPost(request, "/api/v1/outlier", (userId, body) =>
    apiDetectOutliers(userId, {
      niche: String(body.niche ?? ""),
      period: body.period ? String(body.period) : undefined,
      platform: body.platform ? String(body.platform) : undefined,
      channelSize: body.channelSize ? String(body.channelSize) : undefined,
      language: body.language ? String(body.language) : undefined,
    })
  );
}
