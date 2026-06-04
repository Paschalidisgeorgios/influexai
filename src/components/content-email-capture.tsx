"use client";

import { useEffect, useState } from "react";
import { subscribeNewsletter } from "@/app/actions/newsletter";

function EmailForm({
  source,
  title,
  subtitle,
  compact = false,
}: {
  source: string;
  title: string;
  subtitle: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const res = await subscribeNewsletter(email, source);
    setStatus(res.ok ? "done" : "error");
    setMessage(res.message);
    if (res.ok) setEmail("");
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0a0a0a] ${
        compact ? "p-4" : "p-6 my-10"
      }`}
    >
      <p className={`font-medium text-white ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </p>
      <p className="mt-1 text-xs text-white/50">{subtitle}</p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.com"
          disabled={status === "loading" || status === "done"}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-[#B4FF00]/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "done"}
          className="rounded-xl bg-[#B4FF00] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#c8ff33] disabled:opacity-50"
        >
          {status === "loading" ? "…" : "Abonnieren"}
        </button>
      </form>
      {message && (
        <p
          className={`mt-2 text-xs ${status === "error" ? "text-red-400" : "text-[#B4FF00]"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export function ContentEmailCaptureInline({ source }: { source: string }) {
  return (
    <EmailForm
      source={source}
      title="Wöchentliche Creator Tipps direkt ins Postfach"
      subtitle="Kuratiert für YouTube Shorts — kein Spam, jederzeit abmeldbar."
    />
  );
}

export function ContentEmailCaptureSidebar({ source }: { source: string }) {
  return (
    <EmailForm
      source={source}
      title="Creator Newsletter"
      subtitle="Tipps, die wirklich Views bringen."
      compact
    />
  );
}

export function ContentEmailExitIntent({ source }: { source: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("exit_intent_shown") === "1") return;

    const onScroll = () => {
      const scrolled =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);
      if (scrolled >= 0.7) {
        setOpen(true);
        sessionStorage.setItem("exit_intent_shown", "1");
        window.removeEventListener("scroll", onScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-w-md w-full rounded-2xl border border-[#B4FF00]/30 bg-[#0a0a0a] p-6 shadow-xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 text-white/40 hover:text-white"
          aria-label="Schließen"
        >
          ✕
        </button>
        <EmailForm
          source={`${source}-exit`}
          title="Bevor du gehst: 5 Creator-Tipps die viral gehen"
          subtitle="Einmal anmelden — wöchentlich umsetzbare Shorts-Taktiken."
        />
      </div>
    </div>
  );
}
