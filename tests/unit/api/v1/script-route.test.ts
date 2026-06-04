import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/v1/script/route";

vi.mock("@/app/api/v1/middleware", () => ({
  authenticateApiRequest: vi.fn(),
  logApiRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api-v1/generators", () => ({
  apiGenerateScript: vi.fn(),
}));

describe("POST /api/v1/script", () => {
  it("returns 401 without auth header", async () => {
    const { authenticateApiRequest } = await import("@/app/api/v1/middleware");
    const { apiError } = await import("@/lib/api-v1/errors");
    vi.mocked(authenticateApiRequest).mockResolvedValue({
      ok: false,
      response: apiError(401, "Invalid API key", "INVALID_KEY"),
    });

    const req = new Request("http://localhost/api/v1/script", {
      method: "POST",
      body: JSON.stringify({ topic: "Test" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns script on valid request", async () => {
    const { authenticateApiRequest } = await import("@/app/api/v1/middleware");
    const { apiGenerateScript } = await import("@/lib/api-v1/generators");

    vi.mocked(authenticateApiRequest).mockResolvedValue({
      ok: true,
      ctx: { userId: "user-123", apiKeyId: "key-1" },
    });

    vi.mocked(apiGenerateScript).mockResolvedValue({
      ok: true,
      data: {
        script: "[HOOK] test",
        hookVariants: ["hook a"],
        wordCount: 3,
        estimatedSeconds: 2,
      },
      creditsUsed: 2,
      creditsRemaining: 48,
    });

    const req = new Request("http://localhost/api/v1/script", {
      method: "POST",
      headers: { Authorization: "Bearer inf_live_" + "a".repeat(32) },
      body: JSON.stringify({
        topic: "Test",
        duration: "60s",
        tone: "energetic",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.script).toBeDefined();
  });

  it("returns 402 when insufficient credits", async () => {
    const { authenticateApiRequest } = await import("@/app/api/v1/middleware");
    const { apiGenerateScript } = await import("@/lib/api-v1/generators");

    vi.mocked(authenticateApiRequest).mockResolvedValue({
      ok: true,
      ctx: { userId: "user-123", apiKeyId: "key-1" },
    });

    vi.mocked(apiGenerateScript).mockResolvedValue({
      ok: false,
      error: "Insufficient credits",
      code: "INSUFFICIENT_CREDITS",
      creditsRemaining: 0,
    });

    const req = new Request("http://localhost/api/v1/script", {
      method: "POST",
      headers: { Authorization: "Bearer inf_live_" + "b".repeat(32) },
      body: JSON.stringify({ topic: "Test" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(402);
  });
});
