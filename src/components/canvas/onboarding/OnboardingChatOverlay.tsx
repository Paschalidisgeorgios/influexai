"use client";

import { memo, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, X } from "lucide-react";
import { glassSurfaceClass } from "@/lib/glass-classes";
import { useOnboardingStore } from "@/lib/canvas/onboarding-store";

function OnboardingChatOverlayComponent() {
  const chatOpen = useOnboardingStore((s) => s.chatOpen);
  const closeChat = useOnboardingStore((s) => s.closeChat);
  const messages = useOnboardingStore((s) => s.messages);
  const loading = useOnboardingStore((s) => s.loading);
  const sendUserMessage = useOnboardingStore((s) => s.sendUserMessage);
  const touchActivity = useOnboardingStore((s) => s.touchActivity);

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = draft.trim();
      if (!text || loading) return;
      setDraft("");
      touchActivity();
      void sendUserMessage(text);
    },
    [draft, loading, sendUserMessage, touchActivity]
  );

  return (
    <AnimatePresence>
      {chatOpen ? (
        <motion.div
          key="onboarding-chat"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={`${glassSurfaceClass} fixed bottom-6 right-6 z-50 flex h-96 w-80 flex-col overflow-hidden rounded-2xl p-4 shadow-2xl`}
          role="dialog"
          aria-label="Live-Co-Pilot Chat"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ccff00]">
                Live-Co-Pilot
              </p>
              <p className="font-sans text-xs tracking-wide text-zinc-500">
                App Studio · KI-Onboarding
              </p>
            </div>
            <button
              type="button"
              onClick={closeChat}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800/80 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              aria-label="Chat schließen"
            >
              <X size={14} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="mb-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 font-sans text-sm tracking-wide"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl px-3 py-2 leading-relaxed ${
                  message.role === "user"
                    ? "ml-6 bg-zinc-900/80 text-zinc-200"
                    : "mr-4 border border-zinc-800/60 bg-zinc-950/60 text-zinc-300"
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <Loader2 size={14} className="animate-spin text-[#ccff00]" />
                <span className="text-xs">Co-Pilot denkt…</span>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-zinc-800/60 pt-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={loading}
              placeholder="Frage stellen…"
              maxLength={500}
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none disabled:opacity-60"
              aria-label="Nachricht an Co-Pilot"
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#ccff00]/40 bg-[#ccff00]/10 text-[#ccff00] transition-all hover:border-[#ccff00]/70 hover:bg-[#ccff00]/20 hover:shadow-[0_0_16px_rgba(204,255,0,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Senden"
            >
              <Send size={14} />
            </button>
          </form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export const OnboardingChatOverlay = memo(OnboardingChatOverlayComponent);
