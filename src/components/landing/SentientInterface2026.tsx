"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { IntentLink, useCardDwell, type IntentKey } from "@/hooks/useIntentTracking";
import {
  Video,
  LayoutGrid,
  Star,
  Layers,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Palette,
} from "lucide-react";
import { LANDING_BENTO_ACCENT_RGB, LANDING_NEON } from "@/lib/landing-neon-theme";

interface BentoCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "green" | "blue" | "gold";
  tag?: string;
  intentKey: IntentKey;
}

const STATUS_MESSAGES = [
  "Studio bereit",
  "Render-Engine online",
  "Campaign Pack verfügbar",
  "Modell wird geladen…",
  "Ausgabe wird vorbereitet",
];

const TOOL_CHIPS = ["Image", "Video", "Voice", "Campaign Pack"];

const BENTO_CARDS: BentoCard[] = [
  {
    icon: <LayoutGrid size={20} />,
    title: "Campaign Packs",
    description:
      "Ein Briefing. Hooks, Skript, Visuals, Captions und Content-Plan — strukturiert generiert.",
    accent: "green",
    tag: "Automation",
    intentKey: "agent-autopilot",
  },
  {
    icon: <Star size={20} />,
    title: "KI-Influencer",
    description:
      "Dein eigener KI-Avatar. Einmal trainiert, flexibel nutzbar — in verschiedenen Formaten und Styles.",
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

function bentoAccentStyle(accent: BentoCard["accent"]): CSSProperties {
  return { "--bento-accent-rgb": LANDING_BENTO_ACCENT_RGB[accent] } as CSSProperties;
}

function HeroPreview() {
  return (
    <div
      className="relative mx-auto mt-14 w-full max-w-4xl overflow-hidden rounded-2xl border shadow-2xl"
      style={{
        borderColor: "var(--border-soft)",
        background: "rgba(10, 13, 18, 0.9)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: "var(--border-soft)" }}
      >
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
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: LANDING_NEON.green }}
          />
          <span className="font-mono text-[9px]" style={{ color: `${LANDING_NEON.green}B3` }}>
            LIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        <div
          className="border-b p-5 md:border-b-0 md:border-r"
          style={{ borderColor: "var(--border-soft)" }}
        >
          <p className="mb-3 font-mono text-[10px] tracking-widest text-white/50 uppercase">
            KI-Befehl
          </p>
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border-soft)", background: LANDING_NEON.bgPrimary }}
          >
            <p className="font-mono text-sm leading-relaxed text-white/70">
              <span style={{ color: LANDING_NEON.green }}>→</span> Erstelle eine 7-Tage-Kampagne
              für ein Café auf Instagram
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{ width: "72%", background: LANDING_NEON.green }}
                />
              </div>
              <span className="font-mono text-[9px] text-white/50">72%</span>
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
          <p className="mb-3 font-mono text-[10px] tracking-widest text-white/50 uppercase">
            Vorschau
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
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]"
                  style={
                    done
                      ? {
                          background: `rgba(${LANDING_NEON.greenRgb}, 0.15)`,
                          color: LANDING_NEON.green,
                        }
                      : { border: "1px solid rgba(255,255,255,0.1)", color: "transparent" }
                  }
                >
                  {done ? "✓" : ""}
                </span>
                <span className={`text-xs ${done ? "text-white/80" : "text-white/55"}`}>
                  {label}
                </span>
                {!done && (
                  <div className="ml-auto flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1 w-1 animate-bounce rounded-full"
                        style={{
                          background: `rgba(${LANDING_NEON.blueRgb}, 0.6)`,
                          animationDelay: `${i * 150}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div
            className="mt-4 rounded-xl border p-3"
            style={{
              borderColor: `rgba(${LANDING_NEON.cyanRgb}, 0.2)`,
              background: `rgba(${LANDING_NEON.greenRgb}, 0.05)`,
            }}
          >
            <p className="font-mono text-[9px]" style={{ color: `${LANDING_NEON.cyan}CC` }}>
              Creative Score: 94/100 · Export bereit (Beispiel)
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
      className="landing-neon-bento-card group relative flex flex-col gap-4 rounded-2xl p-6"
      style={bentoAccentStyle(card.accent)}
    >
      <div className="flex items-start justify-between">
        <div
          className="landing-neon-bento-icon flex h-10 w-10 items-center justify-center rounded-xl"
        >
          {card.icon}
        </div>
        {card.tag && (
          <span className="landing-neon-bento-tag rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide">
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
    <section className="relative overflow-x-hidden bg-transparent text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute left-[-10%] top-[-5%] h-[500px] w-[500px] rounded-full opacity-25 blur-[120px]"
          style={{ background: LANDING_NEON.green }}
        />
        <div
          className="absolute right-[-8%] top-[20%] h-[400px] w-[400px] rounded-full opacity-20 blur-[120px]"
          style={{ background: LANDING_NEON.blue }}
        />
        <div
          className="absolute bottom-[-5%] left-[30%] h-[350px] w-[350px] rounded-full opacity-20 blur-[120px]"
          style={{ background: LANDING_NEON.yellow }}
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
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] text-white/50 backdrop-blur-sm"
          style={{
            borderColor: `rgba(${LANDING_NEON.violetRgb}, 0.25)`,
            background: `rgba(${LANDING_NEON.violetRgb}, 0.06)`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: LANDING_NEON.cyan }}
            aria-hidden="true"
          />
          {statusMessage}
        </div>

        <h2 className="mx-auto max-w-3xl text-[clamp(36px,6vw,72px)] font-bold leading-[1.06] tracking-tight text-white">
          Briefing rein.{" "}
          <span className="landing-neon-headline-accent">Assets raus.</span>
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/70">
          Vom KI-Befehl bis zum exportfertigen Ergebnis — Bild, Video, Text und Kampagnen
          in einem Workflow.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <IntentLink href="/dashboard" className="landing-neon-btn-primary">
            Studio öffnen <ArrowRight size={15} aria-hidden="true" />
          </IntentLink>
        </div>

        <HeroPreview />
      </div>

      <div id="bento-features" className="relative z-10 px-6 pb-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="landing-neon-divider-glow mb-12" aria-hidden />
          <div className="mb-10 text-center">
            <p
              className="landing-neon-section-kicker landing-neon-section-kicker--blue mb-2"
            >
              Features
            </p>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-white">
              Alles in einem Studio.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] text-white/65">
              Über 20 Tools. Ein Workspace. Für Creator, Marken und Agenturen.
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
