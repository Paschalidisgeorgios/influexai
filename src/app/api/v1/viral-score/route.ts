import { apiCalculateViralScore } from "@/lib/api-v1/generators";
import { handleApiPost } from "@/lib/api-v1/handle-route";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export async function POST(request: Request) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  return handleApiPost(request, "/api/v1/viral-score", (userId, body) =>
    apiCalculateViralScore(userId, {
      script: String(body.script ?? ""),
      thumbnail_idea: String(
        body.thumbnail_idea ?? body.thumbnailIdea ?? ""
      ),
      niche: String(body.niche ?? ""),
      language: body.language ? String(body.language) : undefined,
    })
  );
}
