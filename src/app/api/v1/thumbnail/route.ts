import { apiGenerateThumbnail } from "@/lib/api-v1/generators";
import { handleApiPost } from "@/lib/api-v1/handle-route";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export async function POST(request: Request) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  return handleApiPost(request, "/api/v1/thumbnail", (userId, body) =>
    apiGenerateThumbnail(userId, {
      topic: String(body.topic ?? ""),
      style: body.style ? String(body.style) : undefined,
      colorEnergy: body.colorEnergy ? String(body.colorEnergy) : undefined,
    })
  );
}
