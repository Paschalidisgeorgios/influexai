import { describe, expect, it } from "vitest";
import { parseClaudeJson, stripClaudeJson } from "@/lib/anthropic";

describe("stripClaudeJson", () => {
  it("strips markdown fences and preamble", () => {
    const raw = `Here is the result:
\`\`\`json
[{"title":"Fitness"}]
\`\`\``;
    expect(stripClaudeJson(raw)).toBe('[{"title":"Fitness"}]');
  });

  it("parses wrapped object", () => {
    const raw = "```json\n{\"niches\":[{\"title\":\"A\"}]}\n```";
    const parsed = parseClaudeJson<{ niches: { title: string }[] }>(raw);
    expect(parsed.niches[0].title).toBe("A");
  });
});
