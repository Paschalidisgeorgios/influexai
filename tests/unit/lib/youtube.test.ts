import { describe, it, expect } from "vitest";
import { extractYouTubeVideoId, isYouTubeUrl } from "@/lib/youtube";

describe("youtube utils", () => {
  it("extracts video id from watch URLs", () => {
    expect(
      extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts video id from short URLs", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("detects YouTube URLs", () => {
    expect(isYouTubeUrl("https://youtube.com/watch?v=abc")).toBe(true);
    expect(isYouTubeUrl("https://example.com")).toBe(false);
  });
});
