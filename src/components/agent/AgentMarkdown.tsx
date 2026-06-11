"use client";

import { marked } from "marked";
import { useMemo } from "react";

type Props = {
  content: string;
  className?: string;
};

marked.setOptions({ breaks: true, gfm: true });

export function AgentMarkdown({ content, className = "" }: Props) {
  const html = useMemo(() => {
    const raw = marked.parse(content) as string;
    return raw;
  }, [content]);

  return (
    <div
      className={`agent-markdown text-sm leading-relaxed text-white ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
