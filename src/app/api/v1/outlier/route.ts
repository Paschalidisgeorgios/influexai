import { apiDetectOutliers } from "@/lib/api-v1/generators";
import { handleApiPost } from "@/lib/api-v1/handle-route";

export async function POST(request: Request) {
  return handleApiPost(request, "/api/v1/outlier", (userId, body) =>
    apiDetectOutliers(userId, {
      niche: String(body.niche ?? ""),
      period: body.period ? String(body.period) : undefined,
      channelSize: body.channelSize ? String(body.channelSize) : undefined,
    })
  );
}
