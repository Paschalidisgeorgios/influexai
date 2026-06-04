import type { SeoCheckItem } from "./types";
import { countWords } from "./markdown";

export function runBlogSeoCheck(input: {
  title: string;
  metaDescription: string;
  content: string;
  targetKeyword: string;
}): SeoCheckItem[] {
  const keyword = input.targetKeyword.trim().toLowerCase();
  const titleLower = input.title.toLowerCase();
  const contentLower = input.content.toLowerCase();
  const words = countWords(input.content);
  const keywordCount = keyword
    ? (contentLower.match(new RegExp(escapeRegex(keyword), "g")) ?? []).length
    : 0;
  const density = words > 0 ? (keywordCount / words) * 100 : 0;

  const h1Match = input.content.match(/^#\s+(.+)$/m);
  const h1HasKeyword = keyword
    ? (h1Match?.[1] ?? "").toLowerCase().includes(keyword)
    : false;

  const hasInternalLinks =
    /influexai|\/dashboard\//i.test(input.content) ||
    /\[.*?\]\(\/dashboard/i.test(input.content);

  const hasImages = /!\[.*?\]\(|<img\s/i.test(input.content);

  return [
    {
      id: "title-keyword",
      label: "Title contains keyword",
      status: keyword && titleLower.includes(keyword) ? "pass" : "fail",
    },
    {
      id: "meta-length",
      label: "Meta description < 160 chars",
      status: input.metaDescription.length <= 160 ? "pass" : "fail",
    },
    {
      id: "word-count",
      label: "Word count > 800",
      status: words > 800 ? "pass" : "fail",
    },
    {
      id: "h1-keyword",
      label: "H1 contains keyword",
      status: h1HasKeyword ? "pass" : "fail",
    },
    {
      id: "density",
      label: "Keyword density 1–3%",
      status:
        density >= 1 && density <= 3
          ? "pass"
          : density > 0
            ? "warn"
            : "fail",
    },
    {
      id: "internal-links",
      label: "Internal links present",
      status: hasInternalLinks ? "pass" : "warn",
    },
    {
      id: "images",
      label: "Images in article",
      status: hasImages ? "pass" : "fail",
    },
  ];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
