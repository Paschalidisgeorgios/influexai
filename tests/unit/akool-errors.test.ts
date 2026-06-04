import { describe, expect, it } from "vitest";
import {
  FACE_SWAP_NO_FACE_TARGET,
  mapAkoolErrorMessage,
} from "@/lib/akool-errors";

describe("mapAkoolErrorMessage", () => {
  it("maps Python NoneType shape error to German face hint", () => {
    expect(
      mapAkoolErrorMessage(
        "'NoneType' object has no attribute 'shape'",
        "targetFace"
      )
    ).toBe(FACE_SWAP_NO_FACE_TARGET);
  });

  it("maps empty detect errors for source media", () => {
    expect(mapAkoolErrorMessage("no face detected", "sourceMedia")).toMatch(
      /Video|Gesicht/
    );
  });
});
