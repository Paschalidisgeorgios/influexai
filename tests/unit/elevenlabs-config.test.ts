import { describe, expect, it } from "vitest";
import {
  ELEVENLABS_VOICES,
  resolveElevenLabsVoiceId,
} from "@/lib/elevenlabs-config";

describe("elevenlabs-config", () => {
  it("maps legacy Rachel to current English voice", () => {
    expect(resolveElevenLabsVoiceId("21m00Tcm4TlvDq8ikWAM")).toBe(
      ELEVENLABS_VOICES.en
    );
  });

  it("maps legacy Antoni to German Daniel", () => {
    expect(resolveElevenLabsVoiceId("ErXwobaYiN019PkySvjV")).toBe(
      ELEVENLABS_VOICES.de
    );
  });

  it("resolves locale alias de", () => {
    expect(resolveElevenLabsVoiceId("de")).toBe(ELEVENLABS_VOICES.de);
  });
});
