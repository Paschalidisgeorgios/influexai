import { describe, it, expect } from "vitest";
import {
  API_KEY_PREFIX,
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  maskApiKey,
} from "@/lib/api-keys";

describe("api-keys", () => {
  it("generates keys with correct prefix and length", () => {
    const key = generateApiKey();
    expect(key.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(isValidApiKeyFormat(key)).toBe(true);
  });

  it("validates key format", () => {
    expect(isValidApiKeyFormat(`${API_KEY_PREFIX}${"a".repeat(32)}`)).toBe(
      true
    );
    expect(isValidApiKeyFormat("bad_key")).toBe(false);
  });

  it("hashes keys deterministically", () => {
    const a = hashApiKey("test-key");
    const b = hashApiKey("test-key");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("masks key prefix for display", () => {
    expect(maskApiKey("ABCD")).toBe("inf_...ABCD");
  });
});
