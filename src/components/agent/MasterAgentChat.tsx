"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";
import { saveAgentRun } from "@/app/actions/save-agent-run";
import { notifyGenerationsUpdated, handleApiPlanRequired, openBuyCreditsModal } from "@/lib/client-credits-ui";
import { createClient } from "@/lib/supabase/client";
import { AgentResultCard } from "./AgentResultCard";
import { AgentToolTimeline, AgentToolStepCards } from "./AgentToolTimeline";
import { AgentTypingIndicator } from "./AgentTypingIndicator";
import { AgentWorkingStatus } from "./AgentWorkingStatus";
import type {
  AgentOutputs,
  AgentStreamEvent,
  AgentToolName,
} from "@/lib/agent/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: { tool: AgentToolName; label: string; status: string }[];
  outputs?: AgentOutputs;
};

type Estimate = {
  min: number;
  max: number;
  typical: number;
  label: string;
};

type Props = {
  suggestedPrompts: string[];
};

function greetingKey(): "greeting_morning" | "greeting_day" | "greeting_evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "greeting_morning";
  if (hour < 18) return "greeting_day";
  return "greeting_evening";
}

const TIMELINE_TOOLS: AgentToolName[] = [
  "generate_image",
  "generate_video_from_image",
  "analyze_niche",
  "generate_script",
  "viral_score",
  "generate_thumbnail",
];

function stepsForTimeline(
  messages: ChatMessage[],
  running: boolean
): {
  tool: AgentToolName;
  label?: string;
  status: "pending" | "running" | "done" | "error";
}[] {
  const assistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const stepMap = new Map<
    AgentToolName,
    { label?: string; status: "pending" | "running" | "done" | "error" }
  >();
  for (const s of assistant?.steps ?? []) {
    stepMap.set(s.tool, {
      label: s.label,
      status:
        s.status === "done"
          ? "done"
          : s.status === "running"
            ? "running"
            : s.status === "error"
              ? "error"
              : "pending",
    });
  }

  if (!running && stepMap.size === 0) return [];

  if (stepMap.size > 0) {
    return (assistant?.steps ?? []).map((s) => ({
      tool: s.tool,
      label: s.label,
      status:
        s.status === "done"
          ? "done"
          : s.status === "running"
            ? "running"
            : s.status === "error"
              ? "error"
              : "pending",
    }));
  }

  return TIMELINE_TOOLS.map((tool) => ({
    tool,
    status: "pending" as const,
  }));
}

function hasGalleryMedia(outputs: AgentOutputs): boolean {
  return Boolean(
    outputs.image?.generationId ||
      outputs.video?.generationId ||
      outputs.productPreview?.generationId
  );
}

export function MasterAgentChat({ suggestedPrompts }: Props) {
  const t = useTranslations("agent");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [totalUsed, setTotalUsed] = useState(0);
  const [lastOutputs, setLastOutputs] = useState<AgentOutputs>({});
  const [lastUserGoal, setLastUserGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [activeTool, setActiveTool] = useState<AgentToolName | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const assistantIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      const name =
        data?.full_name?.trim().split(/\s+/)[0] ??
        user.email?.split("@")[0] ??
        "Creator";
      setUsername(name);
    })();
  }, []);

  const loadEstimate = useCallback(async (text: string) => {
    if (!text.trim()) {
      setEstimate(null);
      return;
    }
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, estimateOnly: true }),
      });
      const data = await res.json();
      if (data.estimate) setEstimate(data.estimate);
      if (typeof data.credits === "number") setCreditsLeft(data.credits);
    } catch {
      setEstimate(null);
    }
  }, []);

  useEffect(() => {
    const tmr = setTimeout(() => loadEstimate(input), 400);
    return () => clearTimeout(tmr);
  }, [input, loadEstimate]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [input]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, running]);

  const appendAssistantDelta = (text: string) => {
    const id = assistantIdRef.current;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m
      )
    );
  };

  const updateAssistantStep = (
    tool: AgentToolName,
    label: string,
    status: string
  ) => {
    const id = assistantIdRef.current;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const steps = [...(m.steps ?? [])];
        const idx = steps.findIndex((s) => s.tool === tool);
        const entry = { tool, label, status };
        if (idx >= 0) steps[idx] = entry;
        else steps.push(entry);
        return { ...m, steps };
      })
    );
  };

  const handleSubmit = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || running) return;

    setInput("");
    setRunning(true);
    setSaved(false);
    setActiveTool(null);
    setLastUserGoal(msg);
    setLastOutputs({});

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: msg,
    };
    const assistantId = `a-${Date.now()}`;
    assistantIdRef.current = assistantId;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      steps: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });

      if (res.status === 403) {
        handleApiPlanRequired();
        appendAssistantDelta(
          "\n\nWähle einen Plan um zu starten — alle Tools ab €9,99/Monat."
        );
        setRunning(false);
        return;
      }

      if (res.status === 402) {
        openBuyCreditsModal();
        appendAssistantDelta(
          "\n\nDeine Credits sind aufgebraucht — lade jetzt nach, um weiterzumachen."
        );
        setRunning(false);
        return;
      }

      if (!res.ok || !res.body) {
        appendAssistantDelta("\n\nFehler beim Starten des Agents.");
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          let event: AgentStreamEvent & {
            type?: string;
            min?: number;
            max?: number;
            typical?: number;
            label?: string;
          };
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (event.type === "estimate" && event.label) {
            setEstimate({
              min: event.min ?? 0,
              max: event.max ?? 0,
              typical: event.typical ?? 0,
              label: event.label,
            });
          } else if (event.type === "text_delta") {
            appendAssistantDelta(event.text);
          } else if (event.type === "tool_start") {
            setActiveTool(event.tool);
            updateAssistantStep(event.tool, event.label, "running");
          } else if (event.type === "tool_done") {
            setActiveTool(null);
            const id = assistantIdRef.current;
            if (id) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== id) return m;
                  const steps = (m.steps ?? []).map((s) =>
                    s.tool === event.tool ? { ...s, status: "done" } : s
                  );
                  return { ...m, steps };
                })
              );
            }
          } else if (event.type === "tool_error") {
            setActiveTool(null);
            updateAssistantStep(event.tool, event.error, "error");
          } else if (event.type === "outputs") {
            if (hasGalleryMedia(event.outputs)) {
              notifyGenerationsUpdated();
            }
            setLastOutputs(event.outputs);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, outputs: event.outputs }
                  : m
              )
            );
          } else if (event.type === "credits") {
            setCreditsLeft(event.creditsLeft);
            setTotalUsed(event.totalUsed);
            window.dispatchEvent(new Event("credits-updated"));
          } else if (event.type === "error") {
            appendAssistantDelta(`\n\n⚠️ ${event.message}`);
          }
        }
      }
    } catch {
      appendAssistantDelta("\n\nNetzwerkfehler.");
    } finally {
      setRunning(false);
      setActiveTool(null);
      assistantIdRef.current = null;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveAgentRun(lastUserGoal, lastOutputs, totalUsed);
    setSaving(false);
    if (result.success) setSaved(true);
  };

  const timelineSteps = stepsForTimeline(messages, running);
  const showTimeline = running || timelineSteps.length > 0;
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const isEmpty = messages.length === 0;
  const creditHint = estimate
    ? t("credit_confirm", { credits: estimate.typical })
    : input.trim()
      ? t("credit_confirm", { credits: "…" })
      : null;

  const renderInputForm = (compact: boolean) => (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div
        className={`relative rounded-2xl border border-white/[0.12] bg-white/[0.04] transition-colors focus-within:border-[var(--accent,#B4FF00)] ${
          compact ? "p-3" : "p-5"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder={t("input_placeholder")}
          disabled={running}
          rows={compact ? 2 : 3}
          className={`w-full resize-none bg-transparent text-[#F0EFE8] leading-relaxed placeholder:text-white/30 outline-none ${
            compact ? "min-h-[44px] text-sm pl-1 pr-12 pb-1" : "min-h-[72px] text-base pl-1 pr-14 pb-10"
          }`}
        />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <button
            type="button"
            disabled
            title={t("attach_soon")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/35 cursor-not-allowed"
            aria-label={t("attach_soon")}
          >
            <Paperclip size={16} />
          </button>
        </div>
        <button
          type="submit"
          disabled={running || !input.trim()}
          className={`absolute flex items-center justify-center rounded-xl bg-[var(--accent,#B4FF00)] text-[#060608] shadow-[0_0_20px_color-mix(in_srgb,var(--accent,#B4FF00)_30%,transparent)] disabled:opacity-35 hover:brightness-105 transition-all ${
            compact
              ? "right-2 bottom-2 h-9 w-9"
              : "right-4 bottom-4 h-11 w-11 md:h-12 md:w-12"
          }`}
          aria-label={t("send")}
        >
          {running ? (
            <Loader2 size={compact ? 18 : 22} className="animate-spin" />
          ) : (
            <ArrowUp size={compact ? 18 : 22} strokeWidth={2.5} />
          )}
        </button>
      </div>
      {creditHint && !compact && (
        <p className="mt-2 text-center text-xs text-white/50">{creditHint}</p>
      )}
    </form>
  );

  const quickActionChips = (
    <div className="mt-6 flex w-full min-w-0 flex-wrap justify-center gap-2">
      {suggestedPrompts.map((chip) => (
        <button
          key={chip}
          type="button"
          disabled={running}
          onClick={() => void handleSubmit(chip)}
          className="shrink-0 rounded-full border border-white/[0.15] px-4 py-2.5 text-[13px] font-medium text-white/65 hover:border-[var(--accent,#B4FF00)]/35 hover:text-[var(--accent,#B4FF00)] transition-colors disabled:opacity-40"
          style={{ borderWidth: "0.5px" }}
        >
          {chip}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#060608]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {isEmpty ? (
          <div className="relative flex min-h-full flex-col items-center justify-center px-2 py-8 md:py-12">
            <div
              className="pointer-events-none absolute inset-x-0 top-1/3 h-64 opacity-100"
              style={{
                background:
                  "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(180,255,0,0.06) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <div className="relative w-full max-w-2xl">
              <div className="mb-8 flex items-start gap-3">
                <span
                  className="inline-grid shrink-0 place-items-center rounded-lg bg-[var(--accent,#B4FF00)] text-[#060608] font-extrabold text-lg"
                  style={{ width: 32, height: 32, marginRight: 0 }}
                  aria-hidden
                >
                  I
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-base text-[#F0EFE8] font-medium">
                    {t(greetingKey(), { name: username || "…" })}
                  </p>
                  <h1 className="mt-1 text-2xl md:text-3xl font-bold text-[#F0EFE8] leading-tight">
                    {t("hero_headline")}
                  </h1>
                </div>
              </div>
              {renderInputForm(false)}
              {quickActionChips}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-2 py-6 md:flex-row md:gap-8">
            {showTimeline && <AgentToolTimeline steps={timelineSteps} />}
            <div className="min-w-0 flex-1 space-y-4">
              {messages.map((m) => {
                const isActiveAssistant =
                  running &&
                  m.role === "assistant" &&
                  m.id === lastAssistant?.id;

                return (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                        m.role === "user"
                          ? "bg-[var(--accent,#B4FF00)]/12 border border-[var(--accent,#B4FF00)]/25 text-[#F0EFE8]"
                          : "bg-[#18181d] border border-white/10 text-[#F0EFE8]"
                      }`}
                    >
                      {isActiveAssistant && activeTool ? (
                        <div className="mb-3">
                          <AgentWorkingStatus tool={activeTool} />
                        </div>
                      ) : null}
                      {m.content ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </p>
                      ) : isActiveAssistant && !activeTool ? (
                        <AgentTypingIndicator label={t("thinking")} />
                      ) : null}
                      {m.steps && m.steps.length > 0 && (
                        <AgentToolStepCards steps={m.steps} />
                      )}
                      {m.outputs &&
                        (Object.keys(m.outputs).some(
                          (k) =>
                            k !== "redirects" &&
                            m.outputs![k as keyof AgentOutputs] != null
                        ) ||
                          (m.outputs.redirects?.length ?? 0) > 0) && (
                          <AgentResultCard outputs={m.outputs} />
                        )}
                    </div>
                  </div>
                );
              })}
              {!running &&
                (Object.keys(lastOutputs).some(
                  (k) =>
                    k !== "redirects" &&
                    lastOutputs[k as keyof AgentOutputs] != null
                ) ||
                  (lastOutputs.redirects?.length ?? 0) > 0) && (
                  <AgentResultCard
                    outputs={lastOutputs}
                    onSave={handleSave}
                    saving={saving}
                    saved={saved}
                  />
                )}
            </div>
          </div>
        )}
      </div>
      {!isEmpty && (
        <div className="shrink-0 border-t border-white/10 bg-[#060608] px-2 py-3 md:px-0">
          <div className="mx-auto max-w-3xl">{renderInputForm(true)}</div>
        </div>
      )}
    </div>
  );
}
