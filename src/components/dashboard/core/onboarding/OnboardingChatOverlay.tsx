"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send } from "lucide-react";
import { useOnboardingStore } from "@/lib/canvas/onboarding-store";

export function OnboardingChatOverlay() {
  const chatOpen = useOnboardingStore((s) => s.chatOpen);
  const messages = useOnboardingStore((s) => s.messages);
  const loading = useOnboardingStore((s) => s.loading);
  const closeChat = useOnboardingStore((s) => s.closeChat);
  const sendMessage = useOnboardingStore((s) => s.sendUserMessage);
  const touchActivity = useOnboardingStore((s) => s.touchActivity);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void sendMessage(text);
  };

  return (
    <AnimatePresence>
      {chatOpen ? (
        <motion.div
          key="chat"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="absolute bottom-4 right-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950/95 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ccff00] text-[10px] font-black text-black">
                AI
              </span>
              <span className="text-sm font-semibold text-white">Live Co-Pilot</span>
            </div>
            <button
              type="button"
              onClick={closeChat}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "assistant"
                    ? "self-start bg-zinc-800/80 text-zinc-200"
                    : "self-end bg-[#ccff00]/10 text-[#ccff00]"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading ? (
              <div className="self-start rounded-xl bg-zinc-800/80 px-3 py-2">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            ) : null}
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800/60 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); touchActivity(); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="Nachricht eingeben…"
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="text-[#ccff00] disabled:opacity-30"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
