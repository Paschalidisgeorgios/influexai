"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import { ArrowRight, Send } from "lucide-react";
import type { ParsedToolCall } from "@/lib/agent/parseAgentResponse";
import { INTENT_TOOL_LABELS } from "@/lib/agent/intent-tool-navigation";
import type { IntentToolId } from "@/lib/agent/intentRouter";

type Props = {
  followUpInput: string;
  onFollowUpInputChange: (value: string) => void;
  followUpRunning: boolean;
  toolCalls: ParsedToolCall[];
  onSendFollowUp: (message: string) => void;
};

function toolCallButtonLabel(call: ParsedToolCall): string {
  const toolId = call.toolId as IntentToolId;
  if (toolId in INTENT_TOOL_LABELS) {
    return `→ ${INTENT_TOOL_LABELS[toolId]}`;
  }
  return `→ ${call.toolId.replace(/-/g, " ")}`;
}

export function toolCallFollowUpMessage(call: ParsedToolCall): string {
  const toolId = call.toolId as IntentToolId;
  const label =
    toolId in INTENT_TOOL_LABELS ? INTENT_TOOL_LABELS[toolId] : call.toolId.replace(/-/g, " ");
  return `Ja, bitte ${label} ausführen.`;
}

export function AgentCanvasFollowUpPanel({
  followUpInput,
  onFollowUpInputChange,
  followUpRunning,
  toolCalls,
  onSendFollowUp,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const growTextarea = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    growTextarea(textareaRef.current);
  }, [followUpInput, growTextarea]);

  const handleSubmit = () => {
    if (!followUpInput.trim() || followUpRunning) return;
    onSendFollowUp(followUpInput);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="nodrag nowheel mt-4 border-t border-white/[0.06] pt-4">
      {toolCalls.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {toolCalls.map((call, index) => (
            <button
              key={`${call.toolId}-${index}`}
              type="button"
              disabled={followUpRunning}
              onClick={() => onSendFollowUp(toolCallFollowUpMessage(call))}
              className="inline-flex items-center gap-1 rounded-lg border border-[#B4FF00]/25 bg-[#B4FF00]/8 px-2.5 py-1.5 text-[10px] font-medium text-[#B4FF00] transition-colors hover:border-[#B4FF00]/45 hover:bg-[#B4FF00]/14 disabled:opacity-40"
            >
              <ArrowRight size={11} aria-hidden />
              {toolCallButtonLabel(call)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-[#0d0d0f] p-2 transition-[border-color,box-shadow] focus-within:border-[#B4FF00] focus-within:shadow-[0_0_0_1px_rgba(180,255,0,0.25),0_0_16px_rgba(180,255,0,0.08)]">
        <textarea
          ref={textareaRef}
          value={followUpInput}
          onChange={(e) => {
            onFollowUpInputChange(e.target.value);
            growTextarea(e.currentTarget);
          }}
          onKeyDown={handleKeyDown}
          disabled={followUpRunning}
          placeholder="Antwort an den Agenten…"
          rows={1}
          className="block w-full resize-none overflow-hidden border-none bg-transparent px-2 py-2 text-[13px] leading-relaxed text-white outline-none placeholder:text-white/35"
          style={{ minHeight: 44, maxHeight: 120 }}
        />
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <span className="text-[10px] text-white/25">Enter · Shift+Enter Zeile</span>
          <button
            type="button"
            disabled={!followUpInput.trim() || followUpRunning}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#B4FF00] px-3 py-1.5 text-[11px] font-bold text-[#060608] transition-opacity disabled:opacity-40"
          >
            <Send size={12} aria-hidden />
            {followUpRunning ? "Sendet…" : "Senden"}
          </button>
        </div>
      </div>
    </div>
  );
}
