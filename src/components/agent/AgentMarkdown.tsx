"use client";

import { marked } from "marked";
import { useMemo } from "react";

type Props = {
  content: string;
  className?: string;
};

marked.setOptions({ breaks: true, gfm: true });
marked.use({
  renderer: {
    html({ text }) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },
  },
});

export function AgentMarkdown({ content, className = "" }: Props) {
  const html = useMemo(() => {
    return marked.parse(content, { async: false }) as string;
  }, [content]);

  return (
    <div
      className={`agent-markdown text-sm leading-relaxed text-white ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
