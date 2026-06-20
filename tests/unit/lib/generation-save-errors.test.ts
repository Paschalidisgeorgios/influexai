import type { PostgrestError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  GENERATIONS_PERMISSION_DENIED_CODE,
  classifyGenerationSaveError,
  toGenerationSaveError,
} from "@/lib/generation-save-errors";

function mockPgError(
  partial: Pick<PostgrestError, "code" | "message">
): PostgrestError {
  return {
    name: "PostgrestError",
    details: "",
    hint: "",
    ...partial,
  } as PostgrestError;
}

describe("generation save errors", () => {
  it("classifies Postgres 42501 as permission denied", () => {
    const result = classifyGenerationSaveError(
      mockPgError({
        code: "42501",
        message: "permission denied for table generations",
      })
    );
    expect(result.code).toBe(GENERATIONS_PERMISSION_DENIED_CODE);
    expect(result.pgCode).toBe("42501");
    expect(result.hint).toContain("GRANT");
  });

  it("classifies missing table 42P01", () => {
    const result = classifyGenerationSaveError(
      mockPgError({
        code: "42P01",
        message: 'relation "public.generations" does not exist',
      })
    );
    expect(result.hint).toContain("generations missing");
  });

  it("toGenerationSaveError wraps PostgrestError", () => {
    const err = toGenerationSaveError(
      mockPgError({
        code: "42501",
        message: "permission denied for table generations",
      })
    );
    expect(err.message).toBe("Generierung konnte nicht gespeichert werden.");
    expect(err.details.code).toBe(GENERATIONS_PERMISSION_DENIED_CODE);
  });
});
