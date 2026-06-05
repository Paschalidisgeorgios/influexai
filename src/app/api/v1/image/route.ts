import { apiGenerateImage } from "@/lib/api-v1/generators";
import { handleApiPost } from "@/lib/api-v1/handle-route";

export async function POST(request: Request) {
  return handleApiPost(request, "/api/v1/image", (userId, body) =>
    apiGenerateImage(userId, {
      prompt: String(body.prompt ?? ""),
      category: body.category ? String(body.category) : undefined,
      aspect_ratio: body.aspect_ratio
        ? String(body.aspect_ratio)
        : body.aspectRatio
          ? String(body.aspectRatio)
          : undefined,
      high_res:
        body.high_res === true ||
        body.highRes === true ||
        body.high_res === "true",
    })
  );
}
