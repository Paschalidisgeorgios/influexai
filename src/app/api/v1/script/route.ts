import { apiGenerateScript } from "@/lib/api-v1/generators";
import { handleApiPost } from "@/lib/api-v1/handle-route";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export async function POST(request: Request) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  return handleApiPost(request, "/api/v1/script", (userId, body) =>
    apiGenerateScript(userId, {
      topic: String(body.topic ?? ""),
      duration: body.duration ? String(body.duration) : undefined,
      tone: body.tone ? String(body.tone) : undefined,
      language: body.language ? String(body.language) : undefined,
      hooks: body.hooks !== false,
    })
  );
}
