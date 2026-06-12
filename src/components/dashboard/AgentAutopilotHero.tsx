"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useDashboardToolOptional } from "@/contexts/DashboardToolContext";

const FALLBACK_CHIPS = [
  "Erstelle 10 virale Hooks für mein Fitness-Business auf TikTok",
  "Plane 7 Tage Content für mein lokales Café",
  "Schreibe ein Reels-Script für mein neues Produkt",
];

export function AgentAutopilotHero() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [chips, setChips] = useState<string[]>(FALLBACK_CHIPS);
  const [chipsLoading, setChipsLoading] = useState(true);
  const { profile, profileLabel, loading: profileLoading } = useCreatorProfile();
  const dashboard = useDashboardToolOptional();

  useEffect(() => {
    dashboard?.setPrompt(prompt);
  }, [dashboard, prompt]);

  useEffect(() => {
    if (profileLabel) {
      dashboard?.setParam("creatorDNA", profileLabel);
    }
  }, [dashboard, profileLabel]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/ki-agent/suggested-prompts");
        const data = (await res.json()) as { prompts?: string[] };
        if (!cancelled && data.prompts?.length) {
          setChips(data.prompts.slice(0, 3));
        }
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setChipsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.nische]);

  const navigate = (text?: string) => {
    const value = (text ?? prompt).trim();
    if (!value) return;
    dashboard?.notifyGenerate(5);
    router.push(`/dashboard/ki-agent?prompt=${encodeURIComponent(value)}`);
  };

  return (
    <section className="mb-10 w-full">
      <h1
        className="font-display text-[clamp(28px,6vw,42px)] leading-none transition-all duration-[1200ms]"
        style={{
          color: "var(--dash-theme-accent, #B4FF00)",
          textShadow: "0 0 32px rgba(var(--dash-theme-r, 180), var(--dash-theme-g, 255), var(--dash-theme-b, 0), 0.2)",
        }}
      >
        AGENT AUTOPILOT
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Beschreibe was du brauchst — der Agent erledigt den Rest.
      </p>

      {!profileLoading && !profile && (
        <p className="mt-2 text-xs text-white/35">
          Richte dein Creator-Profil ein für personalisierte Ergebnisse →{" "}
          <Link
            href="/dashboard/settings"
            className="text-[#B4FF00]/70 hover:text-[#B4FF00]"
          >
            Einstellungen
          </Link>
        </p>
      )}

      {!profileLoading && profileLabel && (
        <span
          className="mt-2 inline-flex rounded-full border px-3 py-1 text-xs text-white/55"
          style={{ borderColor: "var(--dash-theme-accent-25, rgba(255,255,255,0.1))" }}
        >
          Creator DNA: {profileLabel}
        </span>
      )}

      <div className="mt-5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              navigate();
            }
          }}
          placeholder="z.B. Erstelle 10 virale Hooks für mein Fitness-Business auf TikTok"
          rows={4}
          className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-[#0d0d0f] p-4 text-base text-white outline-none transition-[border-color,box-shadow] placeholder:text-white/35 focus:border-[#B4FF00] focus:shadow-[0_0_0_1px_rgba(180,255,0,0.25),0_0_24px_rgba(180,255,0,0.08)]"
        />
        <p className="mt-2 text-xs text-white/25">
          Enter zum Senden · Shift+Enter für neue Zeile
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {chipsLoading
          ? FALLBACK_CHIPS.map((chip) => (
              <span
                key={chip}
                className="h-8 w-40 animate-pulse rounded-full bg-white/[0.06]"
              />
            ))
          : chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setPrompt(chip)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left text-xs text-white/60 transition-colors hover:border-[#B4FF00]/30 hover:text-[#B4FF00]"
              >
                {chip}
              </button>
            ))}
      </div>

      <LoadingButton
        type="button"
        mode="agent"
        isLoading={false}
        onClick={() => navigate()}
        disabled={!prompt.trim()}
        className="mt-4 min-h-[48px] w-full rounded-xl bg-[#B4FF00] py-4 text-lg font-bold text-[#060608] disabled:opacity-40"
      >
        ERSTELLEN
      </LoadingButton>

      <p className="mt-2 text-center text-[11px] text-white/35">
        Kostet Credits — ehrliche Abrechnung pro Anfrage
      </p>

      <div className="mt-5 flex flex-col gap-2 text-xs text-white/40 sm:flex-row sm:justify-center sm:gap-6">
        <span>📝 Beschreibe dein Ziel</span>
        <span className="hidden sm:inline text-white/20">→</span>
        <span>🤖 Agent plant &amp; erstellt</span>
        <span className="hidden sm:inline text-white/20">→</span>
        <span>✅ Content ist fertig</span>
      </div>
    </section>
  );
}
