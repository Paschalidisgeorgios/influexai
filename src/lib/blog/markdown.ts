import { marked } from "marked";
import type { TocEntry } from "./toc";

marked.setOptions({
  gfm: true,
  breaks: true,
});

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-äöüß]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractTocFromMarkdown(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const title = h2[1].trim();
      entries.push({ id: slugifyHeading(title), title, level: 2 });
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      const title = h3[1].trim();
      entries.push({ id: slugifyHeading(title), title, level: 3 });
    }
  }
  return entries;
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const withIds = markdown.replace(
    /^(#{2,3})\s+(.+)$/gm,
    (_, hashes, title) => {
      const level = hashes.length;
      const id = slugifyHeading(title.trim());
      return `${"#".repeat(level)} ${title.trim()} {#${id}}`;
    }
  );

  const renderer = new marked.Renderer();
  renderer.heading = function heading({ text, depth, raw }) {
    const idMatch = String(raw).match(/\s*\{#([^}]+)\}\s*$/);
    const id = idMatch?.[1] ?? slugifyHeading(String(text));
    const clean = String(text).replace(/\s*\{#[^}]+\}\s*$/, "");
    if (depth === 2 || depth === 3) {
      return `<h${depth} id="${id}" class="blog-heading blog-h${depth}">${clean}</h${depth}>`;
    }
    return `<h${depth}>${clean}</h${depth}>`;
  };

  const result = await marked.parse(withIds, { renderer });
  return typeof result === "string" ? result : "";
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
