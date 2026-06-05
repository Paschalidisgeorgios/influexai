"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, Loader2 } from "lucide-react";
import { saveAgentRun } from "@/app/actions/save-agent-run";
import { createClient } from "@/lib/supabase/client";
import { AgentResultCard } from "./AgentResultCard";
import { AgentToolTimeline } from "./AgentToolTimeline";
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

type TabId = "chat" | "workflow";

type Props = {
  suggestedPrompts: string[];
};

const TIMELINE_TOOLS: AgentToolName[] = [
  "analyze_niche",
  "generate_script",
  "calculate_viral_score",
  "create_thumbnail_concept",
];

function stepsForTimeline(
  messages: ChatMessage[],
  running: boolean
): { tool: AgentToolName; status: "pending" | "running" | "done" | "error" }[] {
  const assistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const stepMap = new Map<AgentToolName, "pending" | "running" | "done" | "error">();
  for (const s of assistant?.steps ?? []) {
    stepMap.set(
      s.tool,
      s.status === "done"
        ? "done"
        : s.status === "running"
          ? "running"
          : s.status === "error"
            ? "error"
            : "pending"
    );
  }

  if (!running && stepMap.size === 0) return [];

  return TIMELINE_TOOLS.map((tool) => ({
    tool,
    status: stepMap.get(tool) ?? "pending",
  }));
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
  const [activeTab, setActiveTab] = useState<TabId>("chat");
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
    setLastUserGoal(msg);
    setLastOutputs({});
    setActiveTab("chat");

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
            updateAssistantStep(event.tool, event.label, "running");
          } else if (event.type === "tool_done") {
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
            updateAssistantStep(event.tool, event.error, "error");
          } else if (event.type === "outputs") {
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
  const creditHint = estimate
    ? t("credit_confirm", { credits: estimate.typical })
    : input.trim()
      ? t("credit_confirm", { credits: "…" })
      : null;

  const heroInput = (
    <div className="relative w-full max-w-2xl mx-auto">
      <div
        className="pointer-events-none absolute -inset-x-8 -bottom-8 top-1/4 rounded-[32px] opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(180,255,0,0.08) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0c0f]/90 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-6 px-5 pt-4 border-b border-white/[0.06]">
          {(["chat", "workflow"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab
                  ? "text-[#F0EFE8]"
                  : "text-white/70 hover:text-white/80"
              }`}
            >
              {t(tab === "chat" ? "tab_chat" : "tab_workflow")}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B4FF00] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "chat" ? (
          <form
            className="p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <p className="text-sm text-[rgba(255,255,255,0.65)] mb-1">
              {t("greeting_hey", { name: username || "…" })}
            </p>
            <h2
              className="text-[#F0EFE8] font-bold leading-tight mb-5"
              style={{
                fontSize: "clamp(28px, 5vw, 48px)",
              }}
            >
              {t("hero_headline")}
            </h2>

            <div className="relative">
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
                rows={4}
                className="w-full min-h-[80px] md:min-h-[120px] resize-none rounded-xl bg-[#060608] border border-white/10 px-4 py-4 pr-16 pb-14 text-[#F0EFE8] text-base leading-relaxed placeholder:text-white/25 focus:border-[#B4FF00]/40 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={running || !input.trim()}
                className="absolute right-3 bottom-3 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl bg-[#B4FF00] text-[#060608] shadow-[0_0_24px_rgba(180,255,0,0.25)] disabled:opacity-35 hover:brightness-105 transition-all"
                aria-label={t("send")}
              >
                {running ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <ArrowUp size={22} strokeWidth={2.5} />
                )}
              </button>
            </div>

            {creditHint && (
              <p className="mt-2 text-right text-xs text-[rgba(255,255,255,0.65)]">
                {creditHint}
              </p>
            )}
          </form>
        ) : (
          <div className="p-5 space-y-3">
            <p className="text-sm text-white/80">{t("workflow_desc")}</p>
            <ol className="space-y-2 text-sm text-white/70">
              {(
                [
                  "timeline_niche",
                  "timeline_script",
                  "timeline_viral",
                  "timeline_thumbnail",
                ] as const
              ).map((key, i) => (
                <li
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B4FF00]/15 text-xs font-bold text-[#B4FF00]">
                    {i + 1}
                  </span>
                  {t(key)}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {activeTab === "chat" && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-nowrap">
          {suggestedPrompts.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={running}
              onClick={() => {
                setInput(chip);
                void handleSubmit(chip);
              }}
              className="shrink-0 whitespace-nowrap rounded-full border border-white/[0.15] px-5 py-2.5 text-[13px] font-medium text-white/65 hover:border-[#B4FF00]/35 hover:text-[#B4FF00] transition-colors disabled:opacity-40"
              style={{ borderWidth: "0.5px" }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#060608]">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0"
      >
        <div
          className={`flex flex-col px-4 ${
            messages.length === 0
              ? "justify-center min-h-full py-10 md:py-16"
              : "py-6 md:py-8"
          }`}
        >
          {heroInput}

          {messages.length > 0 && (
            <div
              className={`mt-10 max-w-3xl mx-auto w-full flex flex-col md:flex-row gap-6 md:gap-8 ${
                showTimeline ? "" : ""
              }`}
            >
              {showTimeline && (
                <AgentToolTimeline steps={timelineSteps} />
              )}

              <div className="flex-1 min-w-0 space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                        m.role === "user"
                          ? "bg-[#B4FF00]/12 border border-[#B4FF00]/25 text-[#F0EFE8]"
                          : "bg-[#18181d] border border-white/10 text-[#F0EFE8]"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {m.content ||
                          (running && m.role === "assistant" ? "…" : "")}
                      </p>
                      {m.outputs && Object.keys(m.outputs).length > 0 && (
                        <div className="mt-3">
                          <AgentResultCard outputs={m.outputs} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {running && !messages.some((m) => m.role === "assistant" && m.content) && (
                  <p className="text-sm text-[#B4FF00] flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {t("thinking")}
                  </p>
                )}
              </div>
            </div>
          )}

          {Object.keys(lastOutputs).length > 0 && !running && (
            <div className="mt-8 max-w-2xl mx-auto w-full">
              <AgentResultCard
                outputs={lastOutputs}
                onSave={handleSave}
                saving={saving}
                saved={saved}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
