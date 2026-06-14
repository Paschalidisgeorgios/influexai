import DOMPurify from "isomorphic-dompurify";
import { markdownToHtml } from "@/lib/blog/markdown";

const HTML_SANITIZE_OPTIONS = { USE_PROFILES: { html: true } } as const;

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, HTML_SANITIZE_OPTIONS);
}

export async function markdownToSafeHtml(markdown: string): Promise<string> {
  const raw = await markdownToHtml(markdown);
  return sanitizeHtml(raw);
}
