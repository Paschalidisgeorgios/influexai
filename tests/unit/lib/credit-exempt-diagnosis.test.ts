import { afterEach, describe, expect, it, vi } from "vitest";
import { isCreditExemptProfile } from "@/lib/credit-exempt-diagnosis.server";

describe("isCreditExemptProfile", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("exempt when is_admin is true", () => {
    expect(
      isCreditExemptProfile({
        email: "user@example.com",
        is_admin: true,
        role: "user",
      })
    ).toEqual({ exempt: true, reason: "is_admin" });
  });

  it("exempt when role is admin", () => {
    expect(
      isCreditExemptProfile({
        email: "user@example.com",
        is_admin: false,
        role: "admin",
      })
    ).toEqual({ exempt: true, reason: "admin_role" });
  });

  it("exempt when email is in default ADMIN_EMAIL_ALLOWLIST", () => {
    expect(
      isCreditExemptProfile({
        email: "test@influexai.test",
        is_admin: false,
        role: "user",
      })
    ).toEqual({ exempt: false, reason: null });

    vi.stubEnv(
      "ADMIN_EMAIL_ALLOWLIST",
      "test@influexai.test,other@example.com"
    );
    expect(
      isCreditExemptProfile({
        email: "test@influexai.test",
        is_admin: false,
        role: "user",
      })
    ).toEqual({ exempt: true, reason: "email_allowlist" });
  });

  it("not exempt for ordinary paid user", () => {
    vi.stubEnv("ADMIN_EMAIL_ALLOWLIST", "admin-only@example.com");
    expect(
      isCreditExemptProfile({
        email: "billing-smoke@influexai.test",
        is_admin: false,
        role: "user",
      })
    ).toEqual({ exempt: false, reason: null });
  });
});
