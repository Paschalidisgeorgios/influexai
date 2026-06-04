import { apiGenerateThumbnail } from "@/lib/api-v1/generators";
import { handleApiPost } from "@/lib/api-v1/handle-route";

export async function POST(request: Request) {
  return handleApiPost(request, "/api/v1/thumbnail", (userId, body) =>
    apiGenerateThumbnail(userId, {
      topic: String(body.topic ?? ""),
      style: body.style ? String(body.style) : undefined,
      colorEnergy: body.colorEnergy ? String(body.colorEnergy) : undefined,
    })
  );
}
