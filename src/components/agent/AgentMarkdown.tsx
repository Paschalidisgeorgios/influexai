"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  parseAgentResponse,
  type ParsedToolCall,
} from "@/lib/agent/parseAgentResponse";

type Props = {
  content: string;
  className?: string;
};

export function AgentMarkdown({ content, className = "" }: Props) {
  const parsed = useMemo(() => parseAgentResponse(content), [content]);
  const [toolCalls, setToolCalls] = useState<ParsedToolCall[]>([]);

  useEffect(() => {
    setToolCalls(parsed.toolCalls);
  }, [parsed.toolCalls]);

  void toolCalls;

  return (
    <div className={`agent-markdown text-sm leading-relaxed text-white ${className}`}>
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
