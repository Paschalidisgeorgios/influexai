import { handleApiGet } from "@/lib/api-v1/handle-route";
import { getApiMeInfo } from "@/lib/api-v1/generators";

export async function GET(request: Request) {
  return handleApiGet(request, "/api/v1/me", (userId) => getApiMeInfo(userId));
}
