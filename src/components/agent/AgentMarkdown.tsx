"use client";

import { useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import {
  parseAgentResponse,
  type ParsedToolCall,
} from "@/lib/agent/parseAgentResponse";

type Props = {
  content: string;
  className?: string;
  variant?: "dark" | "light";
  onToolCallsParsed?: (calls: ParsedToolCall[]) => void;
};

const LIGHT_MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      className="agent-markdown-link font-medium text-neutral-800 underline decoration-[#B4FF00]/55 underline-offset-2 hover:text-neutral-950 hover:decoration-[#B4FF00]"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-neutral-950">{children}</strong>
  ),
  h1: ({ children }) => (
    <h1 className="mt-3 mb-1.5 text-base font-bold text-neutral-950 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-1.5 text-base font-bold text-neutral-950 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2.5 mb-1 text-sm font-bold text-neutral-950 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-2 text-sm leading-relaxed text-neutral-800 first:mt-0 last:mb-0">
      {children}
    </p>
  ),
  li: ({ children }) => (
    <li className="text-sm leading-relaxed text-neutral-800">{children}</li>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1.5 pl-5 marker:text-neutral-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-neutral-500">
      {children}
    </ol>
  ),
};

const DARK_MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a href={href} className="agent-markdown-link">
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#B4FF00]">{children}</strong>
  ),
};

export function AgentMarkdown({
  content,
  className = "",
  variant = "dark",
  onToolCallsParsed,
}: Props) {
  const parsed = useMemo(() => parseAgentResponse(content), [content]);
  const isLight = variant === "light";

  useEffect(() => {
    onToolCallsParsed?.(parsed.toolCalls);
  }, [onToolCallsParsed, parsed.toolCalls]);

  const rootClass = isLight
    ? "agent-markdown agent-markdown--light text-sm leading-relaxed text-neutral-800"
    : "agent-markdown text-sm leading-relaxed text-white";

  return (
    <div className={`${rootClass} ${className}`.trim()}>
      <ReactMarkdown
        components={isLight ? LIGHT_MARKDOWN_COMPONENTS : DARK_MARKDOWN_COMPONENTS}
      >
        {parsed.cleanText}
      </ReactMarkdown>
    </div>
  );
}
