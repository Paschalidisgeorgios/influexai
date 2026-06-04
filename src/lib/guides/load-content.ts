import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PillarSlug } from "./pillars";

const cache = new Map<string, string>();

export function loadPillarMarkdown(slug: PillarSlug): string {
  if (cache.has(slug)) return cache.get(slug)!;
  const filePath = join(process.cwd(), "content", "guides", `${slug}.md`);
  const content = readFileSync(filePath, "utf-8");
  cache.set(slug, content);
  return content;
}
