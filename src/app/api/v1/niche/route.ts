import { apiAnalyzeNiche } from "@/lib/api-v1/generators";
import { handleApiPost } from "@/lib/api-v1/handle-route";

export async function POST(request: Request) {
  return handleApiPost(request, "/api/v1/niche", (userId, body) =>
    apiAnalyzeNiche(userId, {
      topic: String(body.topic ?? ""),
      audience: body.audience ? String(body.audience) : undefined,
      format: body.format ? String(body.format) : undefined,
    })
  );
}
