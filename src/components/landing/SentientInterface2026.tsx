"use client";

import { useState, useEffect, useRef } from "react";
import { IntentLink, useCardDwell, type IntentKey } from "@/hooks/useIntentTracking";
import {
  Video,
  LayoutGrid,
  Star,
  Layers,
  ArrowRight,
  Play,
  ChevronRight,
  TrendingUp,
  Palette,
} from "lucide-react";

interface BentoCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "green" | "blue" | "gold";
  tag?: string;
  intentKey: IntentKey;
}

const STATUS_MESSAGES = [
  "AI CORE: ACTIVE",
  "RENDERING ENGINE: ONLINE",
  "CAMPAIGN PACK: READY",
  "MODEL_COMPUTING...",
  "SYNTHESIZING OUTPUT",
];

const TOOL_CHIPS = ["Image", "Video", "Voice", "Campaign Pack"];

const BENTO_CARDS: BentoCard[] = [
  {
    icon: <LayoutGrid size={20} />,
    title: "Campaign Packs",
    description:
      "Ein Briefing. Hooks, Skript, Visuals, Captions und Content-Plan — vollautomatisch generiert.",
    accent: "green",
    tag: "Automation",
    intentKey: "agent-autopilot",
  },
  {
    icon: <Star size={20} />,
    title: "KI-Influencer",
    description:
      "Dein eigener KI-Avatar. Einmal trainiert, unbegrenzt nutzbar — in jedem Format und Style.",
    accent: "gold",
    tag: "Avatar",
    intentKey: "avatar-live",
  },
  {
    icon: <Video size={20} />,
    title: "Video Engine",
    description:
      "Bild zu Video, Text zu Video, Lipsync und Video-Übersetzung — alle Modelle in einem Studio.",
    accent: "blue",
    tag: "Video",
    intentKey: "video-film",
  },
  {
    icon: <Palette size={20} />,
    title: "Brand Consistency",
    description:
      "Deine Markenstimme, Ästhetik und Tonalität werden in jeden Output eingebettet.",
    accent: "gold",
    tag: "Branding",
    intentKey: "visuals",
  },
  {
    icon: <TrendingUp size={20} />,
    title: "Creative Score",
    description:
      "Jeder Output wird automatisch bewertet und bei Bedarf mit Auto-Retry optimiert.",
    accent: "green",
    tag: "Quality AI",
    intentKey: "werbung",
  },
  {
    icon: <Layers size={20} />,
    title: "Multi-Provider Tools",
    description:
      "fal.ai, Akool, ElevenLabs und mehr — alles unter einer Oberfläche, ohne Switching.",
    accent: "blue",
    tag: "20+ Tools",
    intentKey: "audio",
  },
];

const ACCENT_BORDER: Record<BentoCard["accent"], string> = {
  green: "border-[#00FF66]/20 hover:border-[#00FF66]/50",
  blue: "border-[#0066FF]/20 hover:border-[#0066FF]/50",
  gold: "border-[#E0A951]/20 hover:border-[#E0A951]/50",
};

const ACCENT_ICON_BG: Record<BentoCard["accent"], string> = {
  green: "bg-[#00FF66]/10 text-[#00FF66]",
  blue: "bg-[#0066FF]/10 text-[#0066FF]",
  gold: "bg-[#E0A951]/10 text-[#E0A951]",
};

const ACCENT_TAG: Record<BentoCard["accent"], string> = {
  green: "bg-[#00FF66]/10 text-[#00FF66]",
  blue: "bg-[#0066FF]/10 text-[#0066FF]",
  gold: "bg-[#E0A951]/10 text-[#E0A951]",
};

const ACCENT_GLOW: Record<BentoCard["accent"], string> = {
  green: "hover:shadow-[0_0_32px_rgba(0,255,102,0.08)]",
  blue: "hover:shadow-[0_0_32px_rgba(0,102,255,0.08)]",
  gold: "hover:shadow-[0_0_32px_rgba(224,169,81,0.08)]",
};

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-14 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0e] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex items-center gap-4">
          {(["RENDERING_CORE_v2.6", "FPS: 60", "RES: 4K"] as const).map((stat) => (
            <span key={stat} className="font-mono text-[9px] tracking-wider text-white/25">
              {stat}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00FF66]" />
          <span className="font-mono text-[9px] text-[#00FF66]/70">LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        <div className="border-b border-white/[0.06] p-5 md:border-b-0 md:border-r">
          <p className="mb-3 font-mono text-[10px] tracking-widest text-white/30 uppercase">
            AI Command
          </p>
          <div className="rounded-xl border border-white/[0.06] bg-[#050507] p-4">
            <p className="font-mono text-sm leading-relaxed text-white/70">
              <span className="text-[#00FF66]">→</span> Erstelle eine 7-Tage-Kampagne für ein Café
              auf Instagram
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-[#00FF66]" style={{ width: "72%" }} />
              </div>
              <span className="font-mono text-[9px] text-white/30">72%</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {TOOL_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[10px] text-white/50"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5">
          <p className="mb-3 font-mono text-[10px] tracking-widest text-white/30 uppercase">
            Output Preview
          </p>
          <div className="space-y-2">
            {[
              { label: "Hook-Generierung", done: true },
              { label: "Skript erstellt", done: true },
              { label: "Visuals werden gerendert", done: false },
              { label: "Captions & Hashtags", done: false },
            ].map(({ label, done }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] ${
                    done
                      ? "bg-[#00FF66]/15 text-[#00FF66]"
                      : "border border-white/10 text-transparent"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                <span className={`text-xs ${done ? "text-white/70" : "text-white/30"}`}>
                  {label}
                </span>
                {!done && (
                  <div className="ml-auto flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1 w-1 animate-bounce rounded-full bg-[#0066FF]/60"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-[#00FF66]/15 bg-[#00FF66]/5 p-3">
            <p className="font-mono text-[9px] text-[#00FF66]/70">
              Creative Score: 94/100 · Export bereit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BentoCardItem({ card }: { card: BentoCard }) {
  const { ref, startDwell, cancelDwell } = useCardDwell(card.intentKey);

  return (
    <div
      ref={ref}
      onPointerEnter={() => startDwell(card.intentKey)}
      onPointerLeave={() => cancelDwell(card.intentKey)}
      className={`group relative flex flex-col gap-4 rounded-2xl border bg-[#0a0a0e] p-6 transition-all duration-300 ${ACCENT_BORDER[card.accent]} ${ACCENT_GLOW[card.accent]}`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${ACCENT_ICON_BG[card.accent]}`}
        >
          {card.icon}
        </div>
        {card.tag && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide ${ACCENT_TAG[card.accent]}`}
          >
            {card.tag}
          </span>
        )}
      </div>
      <div>
        <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight text-white">{card.title}</h3>
        <p className="text-[13px] leading-relaxed text-white/45">{card.description}</p>
      </div>
      <ChevronRight
        size={14}
        className="mt-auto self-end text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-white/50"
        aria-hidden="true"
      />
    </div>
  );
}

export default function SentientInterface2026() {
  const [badgeIndex, setBadgeIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setBadgeIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const statusMessage = STATUS_MESSAGES[badgeIndex];

  return (
    <section className="relative overflow-x-hidden bg-[#050507] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute left-[-10%] top-[-5%] h-[500px] w-[500px] rounded-full opacity-25 blur-[120px]"
          style={{ background: "#00FF66" }}
        />
        <div
          className="absolute right-[-8%] top-[20%] h-[400px] w-[400px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "#0066FF" }}
        />
        <div
          className="absolute bottom-[-5%] left-[30%] h-[350px] w-[350px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "#E0A951" }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 px-6 pt-20 pb-16 text-center md:px-12 md:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] text-white/50 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF66]" aria-hidden="true" />
          {statusMessage}
        </div>

        <h2 className="mx-auto max-w-3xl text-[clamp(36px,6vw,72px)] font-bold leading-[1.06] tracking-tight text-white">
          Deine Idee.{" "}
          <span className="bg-gradient-to-r from-[#00FF66] via-[#0066FF] to-[#E0A951] bg-clip-text text-transparent">
            Von KI zur Kampagne.
          </span>
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/45">
          InfluexAI plant, schreibt und erstellt Social-Media-Assets für Creator, Marken und
          Agenturen.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <IntentLink
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-[#00FF66] px-7 py-3.5 text-[14px] font-semibold text-[#050507] no-underline transition-all hover:bg-[#00FF66]/90 hover:shadow-[0_0_32px_rgba(0,255,102,0.3)]"
          >
            Studio starten <ArrowRight size={15} aria-hidden="true" />
          </IntentLink>
          <a
            href="#bento-features"
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-[14px] text-white/70 no-underline backdrop-blur-sm transition-all hover:border-white/30 hover:text-white"
          >
            <Play size={14} aria-hidden="true" /> Demo ansehen
          </a>
        </div>

        <HeroPreview />
      </div>

      <div id="bento-features" className="relative z-10 px-6 pb-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-2 font-mono text-[11px] tracking-[3px] text-[#00FF66]/60 uppercase">
              Features
            </p>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-white">
              Alles in einem Studio.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] text-white/40">
              Über 20 Tools. Ein Workspace. Vollständig auf Creator und Marken ausgerichtet.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENTO_CARDS.map((card) => (
              <BentoCardItem key={card.title} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
