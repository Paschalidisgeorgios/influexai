"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";
import { saveAgentRun } from "@/app/actions/save-agent-run";
import { notifyGenerationsUpdated, handleApiPlanRequired, openBuyCreditsModal } from "@/lib/client-credits-ui";
import { formatStarterFromPrice } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import {
  buildIntentToolUrl,
  INTENT_TOOL_LABELS,
} from "@/lib/agent/intent-tool-navigation";
import { parseOpenToolMarkers } from "@/lib/agent/open-tool-marker";
import type { IntentToolId } from "@/lib/agent/intentRouter";
import { useTypewriterPlaceholder } from "@/hooks/useTypewriterPlaceholder";
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

type ChipGroup = {
  label: string;
  chips: string[];
};

type Props = {
  /** @deprecated use chipGroups */
  suggestedPrompts?: string[];
  featuredPrompts?: string[];
  chipGroups?: ChipGroup[];
};

function greetingKey():
  | "greeting_morning"
  | "greeting_day"
  | "greeting_evening"
  | "greeting_night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "greeting_morning";
  if (hour >= 11 && hour < 18) return "greeting_day";
  if (hour >= 18 && hour < 22) return "greeting_evening";
  return "greeting_night";
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

export function MasterAgentChat({
  suggestedPrompts = [],
  featuredPrompts = [],
  chipGroups = [],
}: Props) {
  const t = useTranslations("agent");
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [routingToast, setRoutingToast] = useState<string | null>(null);
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

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const typewriterExamples = useMemo(
    () => [
      t("typewriter_example_1"),
      t("typewriter_example_2"),
      t("typewriter_example_3"),
      t("typewriter_example_4"),
      t("typewriter_example_5"),
    ],
    [t]
  );

  const isEmpty = messages.length === 0;
  const typewriterText = useTypewriterPlaceholder({
    examples: typewriterExamples,
    enabled: isEmpty && !input.trim() && !inputFocused && !prefersReducedMotion,
  });

  const inputPlaceholder =
    inputFocused || input.trim() || prefersReducedMotion
      ? t("input_placeholder_focused")
      : typewriterText || t("input_placeholder_focused");

  useEffect(() => {
    if (!routingToast) return;
    const tmr = window.setTimeout(() => setRoutingToast(null), 4000);
    return () => window.clearTimeout(tmr);
  }, [routingToast]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!running) textareaRef.current?.focus();
  }, [running]);

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

  const growTextarea = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    growTextarea(el);
  }, [input, growTextarea]);

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

    try {
      const intentRes = await fetch("/api/agent/intent-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: msg }),
      });
      if (intentRes.ok) {
        const intent = (await intentRes.json()) as {
          tool: IntentToolId;
          prefill: Record<string, string>;
          confidence: number;
        };
        console.log(
          "[intent-router]",
          msg.slice(0, 50),
          intent.tool,
          intent.confidence
        );
        if (intent.confidence >= 0.7 && intent.tool !== "ki-agent") {
          setInput("");
          setRoutingToast(
            t("intent_toast", {
              tool: INTENT_TOOL_LABELS[intent.tool] ?? intent.tool,
            })
          );
          router.push(buildIntentToolUrl(intent.tool, intent.prefill ?? {}));
          return;
        }
      }
    } catch {
      /* fall through to agent */
    }

    setInput("");
    textareaRef.current?.focus();
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
          `\n\nWähle einen Plan um zu starten — alle Tools ab €${formatStarterFromPrice("de")}/Monat.`
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
        className={`flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] transition-colors focus-within:border-[rgba(180,255,0,0.4)] ${
          compact ? "p-2.5" : "p-4 sm:p-5"
        }`}
        style={{ minHeight: compact ? undefined : 96 }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            growTextarea(e.currentTarget);
          }}
          onInput={(e) => {
            growTextarea(e.currentTarget);
          }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder={inputPlaceholder}
          disabled={running}
          rows={1}
          className={`w-full resize-none overflow-hidden bg-transparent text-[#F0EFE8] leading-relaxed placeholder:text-white/40 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            compact ? "text-sm" : "text-lg"
          }`}
          style={{ minHeight: compact ? 24 : 96, maxHeight: compact ? 96 : 160 }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            title={t("attach_soon")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] text-white/35 cursor-not-allowed sm:h-7 sm:w-7 sm:rounded"
            aria-label={t("attach_soon")}
          >
            <Paperclip className="h-[18px] w-[18px] sm:h-3.5 sm:w-3.5" />
          </button>
          <div className="flex-1" aria-hidden />
          <button
            type="submit"
            disabled={running || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#B4FF00] text-[#060608] transition-opacity hover:brightness-105 disabled:cursor-not-allowed sm:h-11 sm:w-11 sm:min-h-[44px] sm:min-w-[44px]"
            style={{
              opacity: input.trim() && !running ? 1 : 0.3,
            }}
            aria-label={t("send")}
          >
            {running ? (
              <Loader2 size={18} className="animate-spin sm:h-4 sm:w-4" />
            ) : (
              <ArrowUp size={18} strokeWidth={2.5} className="sm:h-4 sm:w-4" />
            )}
          </button>
        </div>
      </div>
      {creditHint && !compact && (
        <p className="mt-2 text-center text-xs text-white/50">{creditHint}</p>
      )}
      {!compact && isEmpty && (
        <p className="mt-1.5 text-center text-[10px] leading-snug text-white/38 sm:text-[11px]">
          {t("plan_preview_routing_hint")}
        </p>
      )}
    </form>
  );

  const resolvedChipGroups: ChipGroup[] =
    chipGroups.length > 0
      ? chipGroups
      : suggestedPrompts.length > 0
        ? [{ label: t("group_quick_start"), chips: suggestedPrompts }]
        : [];

  const kiAgentHref = (prompt?: string) =>
    prompt
      ? `/dashboard/ki-agent?prompt=${encodeURIComponent(prompt)}`
      : "/dashboard/ki-agent";

  const quickActionChips = resolvedChipGroups.length > 0 && (
    <div className="mt-4 w-full max-w-md mx-auto min-w-0 space-y-3 sm:mt-5">
      {resolvedChipGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
            {group.label}
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {group.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={running}
                onClick={() => void handleSubmit(chip)}
                title={t("execute_hint")}
                className="flex h-12 min-h-[44px] items-center justify-center rounded-full border border-white/[0.15] px-3 text-[14px] font-medium leading-tight text-white/70 hover:border-[var(--accent,#B4FF00)]/35 hover:text-[var(--accent,#B4FF00)] transition-colors disabled:opacity-40 sm:text-[13px]"
                style={{ borderWidth: "0.5px" }}
              >
                <span className="line-clamp-2 text-center">{chip}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-center text-[10px] text-white/35">{t("execute_hint")}</p>
    </div>
  );

  const featuredPromptSection = featuredPrompts.length > 0 && (
    <div className="mt-4 w-full min-w-0">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#B4FF00]/70">
        {t("featured_prompts_label")}
      </p>
      <div className="flex flex-col gap-2">
        {featuredPrompts.map((prompt) => (
          <Link
            key={prompt}
            href={kiAgentHref(prompt)}
            className="block rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5 text-left text-[13px] leading-snug text-white/75 transition-colors hover:border-[#B4FF00]/30 hover:text-[#F0EFE8] sm:text-sm"
          >
            {prompt}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={kiAgentHref()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#B4FF00] px-4 py-2 text-[12px] font-bold text-[#060608] transition-opacity hover:brightness-105 sm:text-[13px]"
        >
          {t("cta_plan_preview")}
        </Link>
        <Link
          href={kiAgentHref()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/[0.14] px-4 py-2 text-[12px] font-semibold text-white/75 transition-colors hover:border-[#B4FF00]/35 hover:text-[#B4FF00] sm:text-[13px]"
        >
          {t("cta_ki_agent")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#060608]">
      {routingToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[#B4FF00]/30 bg-[#0f0f12] px-4 py-3 text-sm font-medium text-[#F0EFE8] shadow-lg">
          {routingToast}
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {isEmpty ? (
          <div className="relative flex min-h-0 flex-col items-stretch justify-start px-1 pt-1 pb-3 md:min-h-full md:items-center md:justify-center md:px-2 md:py-12">
            <div
              className="pointer-events-none absolute inset-x-0 top-1/4 h-48 opacity-100 md:top-1/3 md:h-64"
              style={{
                background:
                  "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(180,255,0,0.06) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <div className="relative w-full max-w-2xl">
              <div className="mb-4 flex items-start gap-3 md:mb-8">
                <span
                  className="inline-grid shrink-0 place-items-center rounded-lg bg-[var(--accent,#B4FF00)] text-[#060608] font-extrabold text-base sm:text-lg"
                  style={{ width: 28, height: 28 }}
                  aria-hidden
                >
                  I
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm text-[#F0EFE8] font-medium sm:text-base">
                    {t(greetingKey(), { name: username || "…" })}
                  </p>
                  <h1 className="mt-0.5 text-xl font-bold text-[#F0EFE8] leading-tight sm:mt-1 sm:text-2xl md:text-3xl">
                    {t("hero_headline")}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-white/55 sm:text-[0.9rem]">
                    {t("hero_subline")}
                  </p>
                </div>
              </div>

              <div
                className="mb-4 rounded-xl border border-[#B4FF00]/20 bg-[#B4FF00]/[0.04] px-4 py-3"
              >
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#B4FF00]">
                  {t("quick_win_title")}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/70 sm:text-sm">
                  {t("quick_win_body")}
                </p>
                <Link
                  href={kiAgentHref()}
                  className="mt-3 inline-flex min-h-[44px] items-center text-[12px] font-bold text-[#B4FF00] underline-offset-2 hover:underline sm:text-[13px]"
                >
                  {t("cta_free_plan")} →
                </Link>
              </div>

              {renderInputForm(false)}
              {featuredPromptSection}
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
                      {m.content ? (() => {
                        const { cleanText, markers } = parseOpenToolMarkers(
                          m.content
                        );
                        return (
                          <>
                            {cleanText ? (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {cleanText}
                              </p>
                            ) : null}
                            {markers.map((marker) => (
                              <button
                                key={`${marker.tool}-${marker.href}`}
                                type="button"
                                onClick={() => router.push(marker.href)}
                                className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[#B4FF00]/35 bg-[#B4FF00]/10 px-4 py-2 text-sm font-semibold text-[#B4FF00] transition-colors hover:bg-[#B4FF00]/15"
                              >
                                {marker.label}
                              </button>
                            ))}
                          </>
                        );
                      })() : isActiveAssistant && !activeTool ? (
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
