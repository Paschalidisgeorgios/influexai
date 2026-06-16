"use client";

import { useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
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

export function AgentMarkdown({
  content,
  className = "",
  variant = "dark",
  onToolCallsParsed,
}: Props) {
  const parsed = useMemo(() => parseAgentResponse(content), [content]);

  useEffect(() => {
    onToolCallsParsed?.(parsed.toolCalls);
  }, [onToolCallsParsed, parsed.toolCalls]);

  const textClass = variant === "light" ? "text-[#080808]" : "text-white";

  return (
    <div className={`agent-markdown text-sm leading-relaxed ${textClass} ${className}`}>
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} className="agent-markdown-link">
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#B4FF00]">{children}</strong>
          ),
        }}
      >
        {parsed.cleanText}
      </ReactMarkdown>
    </div>
  );
}
