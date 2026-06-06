"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, X } from "lucide-react";
import { handleApiPlanRequired, openBuyCreditsModal } from "@/lib/client-credits-ui";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  userName?: string | null;
  currentPath?: string;
};

function displayFirstName(fullName?: string | null): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "du";
  return trimmed.split(/\s+/)[0] ?? "du";
}

function welcomeMessage(name: string): string {
  return `Hallo ${name} 👋 Ich bin Melodia, deine persönliche Assistentin. Womit kann ich dir heute helfen?`;
}

export default function MelodiaWidget({ userName, currentPath }: Props) {
  const pathname = usePathname();
  const resolvedPath = currentPath ?? pathname ?? "/dashboard";

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: welcomeMessage(displayFirstName(userName)),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, running, open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || running) return;

      setInput("");
      setRunning(true);

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: msg,
      };
      const assistantId = `a-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const history = [...messages, userMsg]
        .filter((m) => m.id !== "welcome" || m.role === "user")
        .filter((m) => m.content.trim())
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/melodia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            history: history.slice(0, -1),
            currentPath: resolvedPath,
            userName,
          }),
        });

        if (res.status === 403) {
          handleApiPlanRequired();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "Wähle einen Plan um zu starten — alle Tools ab €9,99/Monat inklusive.",
                  }
                : m
            )
          );
          return;
        }

        if (res.status === 402) {
          openBuyCreditsModal();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "Du hast leider keine Credits mehr. Lade unter „Credits & Plan“ auf — dann bin ich sofort wieder für dich da.",
                  }
                : m
            )
          );
          return;
        }

        if (!res.ok || !res.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: "Entschuldigung, das hat gerade nicht geklappt. Versuch es bitte noch einmal.",
                  }
                : m
            )
          );
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
            let event: { type?: string; text?: string; message?: string };
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (event.type === "text_delta" && event.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.text }
                    : m
                )
              );
            } else if (event.type === "error" && event.message) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: event.message! }
                    : m
                )
              );
            } else if (event.type === "credits") {
              window.dispatchEvent(new Event("credits-updated"));
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Netzwerkfehler — bitte prüfe deine Verbindung und versuche es erneut.",
                }
              : m
          )
        );
      } finally {
        setRunning(false);
      }
    },
    [messages, running, resolvedPath, userName]
  );

  const orb = (size: "lg" | "sm") => {
    const dim = size === "lg" ? 56 : 36;
    const fontSize = size === "lg" ? 20 : 14;
    return (
      <span
        className={
          size === "lg"
            ? "inline-grid place-items-center rounded-full bg-[var(--accent,#B4FF00)] text-[#060608] font-extrabold melodia-orb-pulse"
            : "inline-grid shrink-0 place-items-center rounded-full bg-[var(--accent,#B4FF00)] text-[#060608] font-extrabold"
        }
        style={{
          width: dim,
          height: dim,
          fontSize,
          boxShadow:
            size === "lg"
              ? "0 0 20px color-mix(in srgb, var(--accent, #B4FF00) 60%, transparent)"
              : undefined,
        }}
        aria-hidden
      >
        M
      </span>
    );
  };

  return (
    <>
      <style jsx global>{`
        @keyframes melodia-orb-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .melodia-orb-pulse {
          animation: melodia-orb-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div
            className="flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#0f0f12] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            style={{ height: 520 }}
            role="dialog"
            aria-label="Melodia Chat"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {orb("sm")}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F0EFE8] leading-none">
                    Melodia
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/50">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent,#B4FF00)]"
                      aria-hidden
                    />
                    Online
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[var(--accent,#B4FF00)] text-[#060608]"
                        : "bg-white/[0.06] text-[#F0EFE8]"
                    }`}
                  >
                    {m.content ||
                      (running && m.role === "assistant" ? (
                        <span className="inline-flex gap-1 text-white/40">
                          <span className="animate-pulse">●</span>
                          <span className="animate-pulse [animation-delay:150ms]">
                            ●
                          </span>
                          <span className="animate-pulse [animation-delay:300ms]">
                            ●
                          </span>
                        </span>
                      ) : null)}
                  </div>
                </div>
              ))}
            </div>

            {/* TODO: Voice Mode — ElevenLabs Integration (wenn Guthaben verfügbar)
                Voice-ID: tbd, STT: browser SpeechRecognition API */}
            <form
              className="shrink-0 border-t border-white/[0.08] p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
            >
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 focus-within:border-[var(--accent,#B4FF00)] transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Frag mich alles..."
                  disabled={running}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#F0EFE8] placeholder:text-white/35 outline-none"
                />
                <button
                  type="submit"
                  disabled={running || !input.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent,#B4FF00)] text-[#060608] disabled:opacity-35 hover:brightness-105 transition-all"
                  aria-label="Senden"
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </button>
              </div>
            </form>
          </div>
        )}

        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            title="Melodia — Deine Assistentin"
            className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#B4FF00)]"
            aria-label="Melodia — Deine Assistentin"
          >
            {orb("lg")}
          </button>
        )}
      </div>
    </>
  );
}
