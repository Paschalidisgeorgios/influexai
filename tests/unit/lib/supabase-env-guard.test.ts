import { describe, expect, it, vi } from "vitest";
import {
  supabaseAnonKeyRef,
  supabaseUrlRef,
  warnSupabaseEnvMismatch,
} from "@/lib/supabase/env-guard";

function jwtWithRef(ref: string) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url"
  );
  const payload = Buffer.from(
    JSON.stringify({ iss: "supabase", ref, role: "anon" })
  ).toString("base64url");
  return `${header}.${payload}.sig`;
}

describe("supabase env guard", () => {
  it("extracts url ref", () => {
    expect(
      supabaseUrlRef("https://jvjmqtxlqfqaoyjklpxh.supabase.co")
    ).toBe("jvjmqtxlqfqaoyjklpxh");
  });

  it("detects url vs anon key mismatch", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSupabaseEnvMismatch(
      "https://jvjmqtxlqfqaoyjklpxh.supabase.co",
      jwtWithRef("hszjafdelcydnppyolkm")
    );
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it("reads anon jwt ref", () => {
    expect(supabaseAnonKeyRef(jwtWithRef("jvjmqtxlqfqaoyjklpxh"))).toBe(
      "jvjmqtxlqfqaoyjklpxh"
    );
  });
});
