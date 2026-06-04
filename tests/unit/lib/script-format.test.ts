import { describe, it, expect } from "vitest";
import {
  countWords,
  parseScriptBlocks,
  replaceHookInScript,
  scriptToPlainText,
  isBRollLine,
} from "@/lib/script-format";

describe("script-format", () => {
  it("counts words", () => {
    expect(countWords("hello world test")).toBe(3);
    expect(countWords("  ")).toBe(0);
  });

  it("parses HOOK MAIN CTA blocks", () => {
    const script = "[HOOK]\nOpen line\n\n[MAIN]\nBody\n\n[CTA]\nSubscribe";
    const blocks = parseScriptBlocks(script);
    expect(blocks.some((b) => b.tag === "hook")).toBe(true);
    expect(blocks.some((b) => b.tag === "main")).toBe(true);
    expect(blocks.some((b) => b.tag === "cta")).toBe(true);
  });

  it("replaces hook section", () => {
    const script = "[HOOK]\nOld\n\n[MAIN]\nBody";
    const updated = replaceHookInScript(script, "New hook");
    expect(updated).toContain("New hook");
    expect(updated).toContain("[MAIN]");
  });

  it("converts to plain text with markers", () => {
    const plain = scriptToPlainText("[HOOK]\nHi\n[CTA]\nBye");
    expect(plain).toContain("HOOK");
    expect(plain).toContain("CTA");
  });

  it("detects B-roll lines", () => {
    expect(isBRollLine("[B-ROLL: close-up]")).toBe(true);
    expect(isBRollLine("normal line")).toBe(false);
  });
});
