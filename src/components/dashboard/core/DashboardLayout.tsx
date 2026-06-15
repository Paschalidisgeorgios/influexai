"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AgentBox } from "./AgentBox";
import { SettingsPanel, type ToolSettings } from "./SettingsPanel";
import { SettingsView } from "./SettingsView";
import { calculateExactCredits } from "@/lib/dashboard/promptOptimizer";
import { GalleryGrid, type GalleryItem } from "./GalleryGrid";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap,
  Calendar,
  TrendingUp,
  Image,
  Video,
  Images,
  Settings,
  CreditCard,
  X,
  ChevronRight,
  Sparkles,
  LogOut,
  Search,
  FileText,
  Loader2,
  // extended tool icons
  Film,
  Repeat2,
  UserRound,
  UserCheck,
  Languages,
  Radio,
  Clapperboard,
  Monitor,
  ShoppingBag,
  Layers,
  Mic2,
  Mic,
  Volume2,
  Camera,
  Bot,
  Cpu,
  Glasses,
  MessageCircle,
  Shuffle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolId =
  // Navigation & Core
  | "studio"           | "gallery"          | "settings"
  // Text Tools
  | "viral-hook"       | "content-calendar"  | "trend-script"
  // Video Tools (Akool + fal.ai)
  | "img-to-video"     | "text-to-video"     | "video-to-video"   | "ref-to-video"
  | "face-swap-video"  | "character-swap"    | "char-studio-video" | "avatar-video"
  | "video-translation"| "talking-avatar"    | "talking-photo"    | "ai-video-editor"
  | "ecommerce-ads"
  // Image Tools
  | "face-swap-image"  | "image-gen"         | "img-to-img"       | "char-studio-image"
  | "jarvis-moderator"
  // Audio & Live Tools
  | "tts"              | "voice-clone"       | "voice-changer"
  | "live-camera"      | "streaming-avatar"  | "live-face-swap"   | "ai-support-agent"
  | "akool-production" | "holographic-avatar"| "akool-edge";

/** fal.ai Modell-Presets für Video-Generierung */
export type FalModelPreset =
  // Kling Video Engine
  | "kling-v3-4k"
  | "kling-v2-master"
  | "kling-v2.5-turbo"
  // Nano Banana Engine
  | "nano-banana-2"
  | "nano-banana-pro";

// ---------------------------------------------------------------------------
// Nav data
// ---------------------------------------------------------------------------

type BadgeVariant = "hot" | "new" | "unlimited";

interface NavItem {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
  accent: string;
  badge?: BadgeVariant;
}

const BADGE_STYLE: Record<BadgeVariant, string> = {
  hot:       "bg-red-500/10   text-red-400   border border-red-500/20",
  new:       "bg-blue-500/10  text-blue-400  border border-blue-500/20",
  unlimited: "bg-cyan-500/10  text-cyan-400  border border-cyan-500/20",
};

const BADGE_LABEL: Record<BadgeVariant, string> = {
  hot:       "Hot",
  new:       "New",
  unlimited: "∞",
};

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Erstellen",
    items: [
      { id: "viral-hook",       label: "Viral Hook",           icon: <Zap size={14} />,          accent: "#B7FF00" },
      { id: "content-calendar", label: "Content Kalender",     icon: <Calendar size={14} />,     accent: "#00D5FF" },
      { id: "trend-script",     label: "Trend Script",         icon: <TrendingUp size={14} />,   accent: "#FFD84D" },
    ],
  },
  {
    title: "Video Tools",
    items: [
      { id: "img-to-video",      label: "Bild zu Video",        icon: <Film size={14} />,          accent: "#8B5DFF", badge: "hot"       },
      { id: "text-to-video",     label: "Text zu Video",        icon: <Video size={14} />,         accent: "#8B5DFF"                      },
      { id: "video-to-video",    label: "Video to Video",       icon: <Repeat2 size={14} />,       accent: "#8B5DFF"                      },
      { id: "ref-to-video",      label: "Reference to Video",   icon: <Layers size={14} />,        accent: "#8B5DFF"                      },
      { id: "face-swap-video",   label: "Gesichtstausch Video", icon: <Shuffle size={14} />,       accent: "#FF6B6B", badge: "new"       },
      { id: "character-swap",    label: "Character Swap",       icon: <UserCheck size={14} />,     accent: "#FF6B6B"                      },
      { id: "char-studio-video", label: "Character Studio",     icon: <UserRound size={14} />,     accent: "#FF6B6B", badge: "new"       },
      { id: "avatar-video",      label: "Avatar Video",         icon: <UserRound size={14} />,     accent: "#00D5FF", badge: "unlimited" },
      { id: "video-translation", label: "Videoübersetzung",     icon: <Languages size={14} />,     accent: "#00D5FF"                      },
      { id: "talking-avatar",    label: "Sprechender Avatar",   icon: <MessageCircle size={14} />, accent: "#00D5FF"                      },
      { id: "talking-photo",     label: "Sprechendes Foto",     icon: <Camera size={14} />,        accent: "#00D5FF"                      },
      { id: "ai-video-editor",   label: "KI-Videoeditor",       icon: <Clapperboard size={14} />,  accent: "#FFD84D"                      },
      { id: "ecommerce-ads",     label: "E-Commerce Product Ads", icon: <ShoppingBag size={14} />, accent: "#FFD84D"                      },
    ],
  },
  {
    title: "Image Tools",
    items: [
      { id: "face-swap-image",   label: "Gesichtstausch Bild",  icon: <Shuffle size={14} />,       accent: "#FF6B6B", badge: "new" },
      { id: "image-gen",         label: "Bildgenerator",        icon: <Image size={14} />,         accent: "#8B5DFF"              },
      { id: "img-to-img",        label: "Bild zu Bild",         icon: <Repeat2 size={14} />,       accent: "#8B5DFF"              },
      { id: "char-studio-image", label: "Character Studio Bild",icon: <UserRound size={14} />,     accent: "#FF6B6B", badge: "new" },
      { id: "jarvis-moderator",  label: "Jarvis Moderator",     icon: <Bot size={14} />,           accent: "#FFD84D"              },
    ],
  },
  {
    title: "Audio Tools",
    items: [
      { id: "tts",           label: "Text-zu-Sprache",    icon: <Volume2 size={14} />, accent: "#00D5FF" },
      { id: "voice-clone",   label: "Stimmenklon",        icon: <Mic2 size={14} />,   accent: "#00D5FF" },
      { id: "voice-changer", label: "Stimmverzerrer",     icon: <Mic size={14} />,    accent: "#00D5FF" },
    ],
  },
  {
    title: "Live & Akool",
    items: [
      { id: "live-camera",        label: "Live-Kamera",              icon: <Camera size={14} />,        accent: "#FF6B6B" },
      { id: "streaming-avatar",   label: "Streaming-Avatar",         icon: <Radio size={14} />,         accent: "#FF6B6B" },
      { id: "live-face-swap",     label: "Live-Gesichtstausch",      icon: <Monitor size={14} />,       accent: "#FF6B6B" },
      { id: "ai-support-agent",   label: "KI-Support-Mitarbeiter",   icon: <MessageCircle size={14} />, accent: "#00D5FF" },
      { id: "akool-production",   label: "Akool Production",         icon: <Cpu size={14} />,           accent: "#FFD84D" },
      { id: "holographic-avatar", label: "Holografische Avatar-Anz.",icon: <Glasses size={14} />,       accent: "#FFD84D" },
      { id: "akool-edge",         label: "Akool Edge",               icon: <Sparkles size={14} />,      accent: "#FFD84D" },
    ],
  },
];

const NAV_BOTTOM: NavItem[] = [
  { id: "gallery",  label: "Galerie",       icon: <Images size={14} />,   accent: "#ccff00" },
  { id: "settings", label: "Einstellungen", icon: <Settings size={14} />, accent: "#ccff00" },
];

// Tools die automatisch das rechte Panel öffnen
const TOOLS_WITH_RIGHT_PANEL = new Set<ToolId>([
  "image-gen", "img-to-img",
  "img-to-video", "text-to-video",
  "ecommerce-ads",
]);

// ---------------------------------------------------------------------------
// Placeholder sub-components
// ---------------------------------------------------------------------------

// AgentBox wird aus AgentBox.tsx importiert (s. import oben)

// GalleryGrid wird aus GalleryGrid.tsx importiert (s. import oben)

// SettingsPanel wird aus SettingsPanel.tsx importiert (s. import oben)

// ---------------------------------------------------------------------------
// Left Sidebar — kompaktes Studio-Nav
// ---------------------------------------------------------------------------

type TopNavId = "studio" | "agent" | "tools" | "projects" | "my-brand";

interface TopNavItem {
  id: TopNavId;
  label: string;
  icon: React.ReactNode;
  toolTarget?: ToolId;   // welches ToolId beim Klick aktiviert wird
}

const TOP_NAV: TopNavItem[] = [
  { id: "agent",    label: "Agent",     icon: <Bot size={15} />,       toolTarget: "gallery"  },
  { id: "tools",    label: "Tools",     icon: <Sparkles size={15} />,  toolTarget: "viral-hook" },
  { id: "projects", label: "Projects",  icon: <Images size={15} />,    toolTarget: "gallery"  },
  { id: "my-brand", label: "My Brand",  icon: <UserRound size={15} />, toolTarget: "settings" },
];

// Welche TopNavItem ist gerade "aktiv"?
function resolveTopNav(toolId: ToolId): TopNavId | null {
  if (toolId === "studio") return "studio";
  if (toolId === "gallery") return "projects";
  if (toolId === "settings") return "my-brand";
  const textTools: ToolId[] = ["viral-hook", "content-calendar", "trend-script"];
  if (textTools.includes(toolId)) return "agent";
  return "tools";
}

function AnimatedCredits({ credits }: { credits: number }) {
  const low   = credits < 10;
  const color = low ? "#ff4444" : "#ccff00";
  return (
    <motion.span
      key={credits}
      initial={{ scale: 1.2, color: "#ccff00" }}
      animate={{ scale: 1, color }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="font-mono text-[12px] font-semibold tabular-nums"
    >
      {credits}
    </motion.span>
  );
}

function LeftSidebar({
  activeTool,
  credits,
  creditsLoaded,
  toolsGenerating,
  onSelect,
}: {
  activeTool: ToolId;
  credits: number;
  creditsLoaded: boolean;
  toolsGenerating: Partial<Record<ToolId, boolean>>;
  onSelect: (id: ToolId) => void;
}) {
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const activeTopNav = resolveTopNav(activeTool);

  // Wenn ein Tool aktiv wird das kein Top-Nav-Element ist, Tools automatisch ausklappen
  const isActiveTool = activeTool !== "studio" && activeTool !== "gallery" && activeTool !== "settings";

  return (
    <aside
      className="fixed left-0 top-0 z-20 flex h-screen w-[240px] flex-col border-r border-white/[0.02]"
      style={{ background: "#09090A" }}
    >
      {/* ── Brand ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onSelect("studio")}
        className="mb-6 flex shrink-0 items-center gap-3 px-2 py-4 transition-opacity hover:opacity-85"
      >
        {/* Icon — abgerundetes Lime-Quadrat */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "#ccff00" }}>
          <span className="text-lg font-black leading-none text-black">I</span>
        </div>
        {/* Wortmarke */}
        <span className="text-[14px] font-bold tracking-wide text-white">
          INFLUEX<span style={{ color: "#ccff00" }}>AI</span>
        </span>
      </button>

      {/* ── Top Nav ────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: "none" }}>
        <div className="space-y-0.5 pt-1">
          {TOP_NAV.map((item) => {
            const isActive = activeTopNav === item.id;
            const anyGenerating = item.id === "tools"
              ? Object.values(toolsGenerating).some(Boolean)
              : false;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "tools") {
                    setToolsExpanded((v) => !v);
                    if (item.toolTarget) onSelect(item.toolTarget);
                  } else if (item.toolTarget) {
                    onSelect(item.toolTarget);
                    setToolsExpanded(false);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-lg py-2 pl-3 pr-3 text-left transition-all"
                style={{
                  background:  isActive ? "rgba(255,255,255,0.04)" : "transparent",
                  borderLeft:  isActive ? "2px solid #ccff00" : "2px solid transparent",
                  paddingLeft: isActive ? "calc(0.75rem - 2px)" : "0.75rem",
                }}
              >
                <span
                  className="shrink-0 transition-colors"
                  style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.28)" }}
                >
                  {anyGenerating && item.id === "tools"
                    ? <Loader2 size={15} className="animate-spin" />
                    : item.icon
                  }
                </span>
                <span
                  className="flex-1 text-xs font-medium transition-colors"
                  style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.38)" }}
                >
                  {item.label}
                </span>
                {item.id === "tools" && (
                  <ChevronRight
                    size={11}
                    className="shrink-0 text-white/15 transition-transform"
                    style={{ transform: (toolsExpanded || isActiveTool) ? "rotate(90deg)" : "none" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tool-Liste (ausklappbar unter "Tools") ─────────────────────── */}
        <AnimatePresence>
          {(toolsExpanded || isActiveTool) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-4 pb-2 pl-2">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/18">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const active     = activeTool === item.id;
                        const generating = !!toolsGenerating[item.id];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item.id)}
                          className="flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left transition-all"
                          style={{
                            background:  active ? "rgba(255,255,255,0.04)" : "transparent",
                            borderLeft:  active ? "2px solid #ccff00" : "2px solid transparent",
                            paddingLeft: active ? "calc(0.5rem - 2px)" : "0.5rem",
                          }}
                          >
                            <span className="shrink-0" style={{ color: active ? item.accent : "rgba(255,255,255,0.22)" }}>
                              {item.icon}
                            </span>
                            <span
                              className="flex-1 truncate text-[11px]"
                              style={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.38)" }}
                            >
                              {item.label}
                            </span>
                            {item.badge && !generating && !active && (
                              <span className={`shrink-0 rounded px-1 text-[9px] font-semibold leading-[1.6] ${BADGE_STYLE[item.badge]}`}>
                                {BADGE_LABEL[item.badge]}
                              </span>
                            )}
                            {generating && (
                              <Loader2 size={10} className="ml-auto animate-spin" style={{ color: item.accent }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Advanced Sektion ───────────────────────────────────────────── */}
        <div className="mt-6">
          <p className="mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/15">
            Advanced
          </p>
          <button
            type="button"
            onClick={() => { onSelect("studio"); setToolsExpanded(false); }}
            className="flex w-full items-center gap-3 rounded-lg py-2 pr-3 text-left transition-all"
            style={{
              background:  activeTool === "studio" ? "rgba(255,255,255,0.04)" : "transparent",
              borderLeft:  activeTool === "studio" ? "2px solid #ccff00" : "2px solid transparent",
              paddingLeft: activeTool === "studio" ? "calc(0.75rem - 2px)" : "0.75rem",
            }}
          >
            <Layers size={14} style={{ color: activeTool === "studio" ? "#ccff00" : "rgba(255,255,255,0.25)" }} />
            <span
              className="text-xs font-medium"
              style={{ color: activeTool === "studio" ? "#ffffff" : "rgba(255,255,255,0.38)" }}
            >
              Studio
            </span>
          </button>
        </div>
      </nav>

      {/* ── Credits + Logout ───────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        {/* Credits */}
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">Credits</span>
          {creditsLoaded ? (
            <span className="flex items-center gap-1 text-white/50">
              <AnimatedCredits credits={credits} />
              <span className="text-[11px] text-white/20">⚡</span>
            </span>
          ) : (
            <span className="h-4 w-10 animate-pulse rounded bg-white/5" />
          )}
        </div>

        {/* Logout */}
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-all hover:bg-red-500/5"
        >
          <LogOut size={13} className="shrink-0text-white/20" />
          <span className="text-[11px] text-white/25">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Studio Home — Cinematic 2026
// ---------------------------------------------------------------------------

interface HeroCard {
  id: ToolId;
  eyebrow: string;
  cta: string;
  sub: string;
  imgUrl?: string;
  accentGlow?: string;
  grid?: boolean;
}

const HERO_CARDS: HeroCard[] = [
  {
    id:         "img-to-video",
    eyebrow:    "Video",
    cta:        "AD FLOW →",
    sub:        "Build ads on one visual canvas",
    imgUrl:     "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=70",
    accentGlow: "#ccff00",
  },
  {
    id:      "avatar-video",
    eyebrow: "Avatar",
    cta:     "AVATAR VIDEO →",
    sub:     "Create talking videos with AI actors",
    imgUrl:  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=900&q=80",
  },
  {
    id:      "viral-hook",
    eyebrow: "AI Agent",
    cta:     "AI MEDIA BUYER →",
    sub:     "Your copilot across every ad account",
    grid:    true,
  },
];

interface SmallCard {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
  badge?: BadgeVariant;
}

const SMALL_CARDS_CREATE: SmallCard[] = [
  { id: "image-gen",     label: "Asset Generator", icon: <Image size={13} />,   badge: "hot" },
  { id: "ecommerce-ads", label: "Video Ad",         icon: <Video size={13} />,   badge: "new" },
  { id: "img-to-img",    label: "Image Ad",          icon: <Images size={13} />          },
];

const SMALL_CARDS_ANALYZE: SmallCard[] = [
  { id: "viral-hook",        label: "Viral Hook",       icon: <Zap size={13} />        },
  { id: "content-calendar",  label: "Content Calendar", icon: <Calendar size={13} />   },
  { id: "trend-script",      label: "Trend Script",     icon: <TrendingUp size={13} /> },
];

function StudioHome({ onSelect }: { onSelect: (id: ToolId) => void }) {
  return (
    <div className="w-full">

      {/* ── Hero heading ──────────────────────────────────────────────────── */}
      <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
        What are you making today?
      </p>

      {/* ── Hero Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        {HERO_CARDS.map((card) => (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            whileHover="hover"
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.22 }}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/[0.03] text-left shadow-2xl transition-all duration-300 hover:border-white/[0.08]"
            style={{
              aspectRatio: "16/10",
              background:  "#0C0C0E",
            }}
          >
            {/* Hintergrundbild */}
            {card.imgUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.imgUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-500 group-hover:opacity-40"
                />
                {/* Cinema-Gradient über dem Bild */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
              </>
            )}

            {/* Vercel-Gitter für AI Media Buyer */}
            {card.grid && (
              <>
                <div
                  className="absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px)," +
                      "linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
                {/* Subtiler radialer Glow-Mittelpunkt */}
                <div
                  className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
                  style={{ background: "white" }}
                />
              </>
            )}

            {/* Lime-Glow für Ad Flow */}
            {card.accentGlow && (
              <div
                className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full opacity-[0.15] blur-2xl transition-opacity duration-500 group-hover:opacity-25"
                style={{ background: card.accentGlow }}
              />
            )}

            {/* Hover-Shine */}
            <motion.div
              variants={{ hover: { opacity: 1 } }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.025] to-transparent"
            />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col justify-between p-5">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
                {card.eyebrow}
              </span>
              <div>
                <p className="text-xl font-light tracking-wide text-white transition-colors group-hover:text-white/90">
                  {card.cta}
                </p>
                <p className="mt-1 text-[11px] text-neutral-400">{card.sub}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Lower Sections ────────────────────────────────────────────────── */}
      <div className="mt-10 grid grid-cols-2 gap-8">

        {/* More ways to create */}
        <div>
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-600">
            More ways to create
          </p>
          <div className="space-y-1">
            {SMALL_CARDS_CREATE.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect(card.id)}
                className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.02] p-3.5 text-left text-xs text-neutral-300 transition-colors hover:border-white/[0.05] hover:bg-white/[0.015]"
                style={{ background: "#080809" }}
              >
                <span className="shrink-0 text-white/25 transition-colors group-hover:text-white/40">
                  {card.icon}
                </span>
                <span className="flex-1 font-medium tracking-wide">{card.label}</span>
                {card.badge && (
                  <span className={`rounded px-1.5 text-[9px] font-semibold leading-[1.7] ${BADGE_STYLE[card.badge]}`}>
                    {BADGE_LABEL[card.badge]}
                  </span>
                )}
                <ChevronRight size={11} className="text-white/10 transition-colors group-hover:text-white/25" />
              </button>
            ))}
          </div>
        </div>

        {/* Analyze & launch */}
        <div>
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-600">
            Analyze &amp; launch
          </p>
          <div className="space-y-1">
            {SMALL_CARDS_ANALYZE.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect(card.id)}
                className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.02] p-3.5 text-left text-xs text-neutral-300 transition-colors hover:border-white/[0.05] hover:bg-white/[0.015]"
                style={{ background: "#080809" }}
              >
                <span className="shrink-0 text-white/25 transition-colors group-hover:text-white/40">
                  {card.icon}
                </span>
                <span className="flex-1 font-medium tracking-wide">{card.label}</span>
                <ChevronRight size={11} className="text-white/10 transition-colors group-hover:text-white/25" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome Bar
// ---------------------------------------------------------------------------

function WelcomeBar({ activeTool }: { activeTool: ToolId }) {
  const allItems = [...NAV_SECTIONS.flatMap((s) => s.items), ...NAV_BOTTOM];
  const tool = allItems.find((t) => t.id === activeTool);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={activeTool}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-8 font-mono text-xs uppercase tracking-widest text-neutral-600"
      >
        {tool?.label ?? "Dashboard"}
      </motion.p>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

// ─── Tool-ID → Anzeigename (für GalleryItem.tool) ────────────────────────────

const TOOL_LABEL: Record<ToolId, string> = {
  // Navigation & Core
  "studio":              "Studio",
  "gallery":             "Galerie",
  "settings":            "Einstellungen",
  // Text
  "viral-hook":          "Viral Hook",
  "content-calendar":    "Content Kalender",
  "trend-script":        "Trend Script",
  // Video
  "img-to-video":        "Image → Video",
  "text-to-video":       "Text → Video",
  "video-to-video":      "Video → Video",
  "ref-to-video":        "Referenz → Video",
  "face-swap-video":     "Face Swap Video",
  "character-swap":      "Character Swap",
  "char-studio-video":   "Character Studio",
  "avatar-video":        "Avatar Video",
  "video-translation":   "Video Translation",
  "talking-avatar":      "Talking Avatar",
  "talking-photo":       "Talking Photo",
  "ai-video-editor":     "AI Video Editor",
  "ecommerce-ads":       "E-Commerce Ads",
  // Image
  "face-swap-image":     "Face Swap Image",
  "image-gen":           "Bild Generator",
  "img-to-img":          "Image → Image",
  "char-studio-image":   "Char Studio Image",
  "jarvis-moderator":    "Jarvis Moderator",
  // Audio
  "tts":                 "Text to Speech",
  "voice-clone":         "Voice Clone",
  "voice-changer":       "Voice Changer",
  // Live & Akool
  "live-camera":         "Live Camera",
  "streaming-avatar":    "Streaming Avatar",
  "live-face-swap":      "Live Face Swap",
  "ai-support-agent":    "AI Support Agent",
  "akool-production":    "Akool Production",
  "holographic-avatar":  "Holographic Avatar",
  "akool-edge":          "Akool Edge",
};

const TEXT_TOOLS = new Set<ToolId>(["viral-hook", "content-calendar", "trend-script"]);

// ─── GalleryFilterBar ─────────────────────────────────────────────────────────

function GalleryFilterBar({
  searchQuery, setSearchQuery, activeFilter, setActiveFilter,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  activeFilter: "all" | "image" | "video" | "text";
  setActiveFilter: (v: "all" | "image" | "video" | "text") => void;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center w-full">
      {/* Suche */}
      <div className="relative w-full sm:max-w-xs">
        <Search
          size={12}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Prompt oder Inhalt suchen…"
          className="w-full rounded-md border py-1.5 pl-8 pr-3 text-xs text-neutral-300 placeholder-neutral-600 outline-none transition-all focus:border-white/10 focus:outline-none"
          style={{ background: "#090909", borderColor: "rgba(255,255,255,0.05)" }}
        />
      </div>

      {/* Typ-Filter — komplett rahmenlos */}
      <div
        className="flex items-center gap-0.5 rounded-lg p-0.5"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        {(
          [
            { id: "all",   label: "Alle",   icon: null },
            { id: "image", label: "Bilder", icon: <Image size={10} /> },
            { id: "video", label: "Videos", icon: <Video size={10} /> },
            { id: "text",  label: "Texte",  icon: <FileText size={10} /> },
          ] as const
        ).map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveFilter(id)}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs transition-colors ${
              activeFilter === id
                ? "bg-neutral-800/80 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── GalleryOrEmpty ───────────────────────────────────────────────────────────

function GalleryOrEmpty({
  filteredAssets, isGalleryLoading, searchQuery,
  onRePrompt, onDeleteAsset, onResetFilter,
}: {
  filteredAssets:  GalleryItem[];
  isGalleryLoading: boolean;
  searchQuery:     string;
  onRePrompt:      (prompt: string, tool: string) => void;
  onDeleteAsset:   (id: string) => void;
  onResetFilter:   () => void;
}) {
  if (!isGalleryLoading && filteredAssets.length === 0) {
    return (
      <div className="mt-8 flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
        <Search size={22} className="text-white/12" />
        <p className="text-xs text-white/25">
          Keine Assets gefunden, die deiner Suche entsprechen.
        </p>
        {searchQuery && (
          <button
            type="button"
            onClick={onResetFilter}
            className="mt-1 text-[11px] text-white/20 underline underline-offset-2 transition-colors hover:text-white/40"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>
    );
  }
  return (
    <GalleryGrid
      assets={filteredAssets}
      isLoading={isGalleryLoading}
      onRePrompt={onRePrompt}
      onDeleteAsset={onDeleteAsset}
    />
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

// ─── API-Helpers (client-side fetch zu unseren Route Handlers) ────────────────

type InitData = { credits: number; assets: GalleryItem[] };

async function fetchDashboardInit(): Promise<InitData | null> {
  try {
    const res = await fetch("/api/dashboard/init", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as InitData;
  } catch {
    return null;
  }
}

type SaveAssetResponse = { asset: GalleryItem; remainingCredits: number };

async function saveAsset(params: {
  type:           GalleryItem["type"];
  url?:           string;
  content?:       string;
  prompt:         string;
  tool:           string;
  cost:           number;
  skipDeduction:  boolean;
}): Promise<SaveAssetResponse | null> {
  try {
    const res = await fetch("/api/dashboard/asset", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(params),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      console.error("[saveAsset]", res.status, body.error);
      return null;
    }
    return (await res.json()) as SaveAssetResponse;
  } catch (err) {
    console.error("[saveAsset] network error:", err);
    return null;
  }
}

async function deleteAsset(id: string): Promise<void> {
  await fetch(`/api/dashboard/asset?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).catch(() => {});
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DashboardLayout() {
  const [activeTool, setActiveTool]         = useState<ToolId>("studio");
  const [isRightPanelOpen, setIsRightPanel] = useState(false);

  // ── Credits — aus Supabase geladen (Fallback: 0 während Ladevorgang) ───────
  const [credits, setCredits]       = useState(0);
  const [creditsLoaded, setCreditsLoaded] = useState(false);

  // ── Gallery state lebt hier, GalleryGrid bekommt es als Props ─────────────
  const [galleryAssets, setGalleryAssets]       = useState<GalleryItem[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);

  // ── Pro-Tool Generierungs-Status (für Sidebar-Spinner) ────────────────────
  const [toolsGenerating, setToolsGenerating] =
    useState<Partial<Record<ToolId, boolean>>>({});

  const setToolGenerating = useCallback((tool: ToolId, value: boolean) => {
    setToolsGenerating((prev) => ({ ...prev, [tool]: value }));
  }, []);

  // ── Suche & Filter ────────────────────────────────────────────────────────
  const [searchQuery,  setSearchQuery]  = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "image" | "video" | "text">("all");

  const filteredAssets = galleryAssets.filter((a) => {
    const matchType   = activeFilter === "all" || a.type === activeFilter;
    const q           = searchQuery.toLowerCase();
    const matchSearch = !q
      || a.prompt.toLowerCase().includes(q)
      || (a.content?.toLowerCase().includes(q) ?? false);
    return matchType && matchSearch;
  });

  // ── Supabase Init: Credits + Gallery beim Mount laden ─────────────────────
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await fetchDashboardInit();
      if (cancelled) return;
      if (data) {
        setCredits(data.credits);
        setGalleryAssets(data.assets);
      }
      setCreditsLoaded(true);
      setIsGalleryLoading(false);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Löscht ein Asset lokal + aus der DB
  const handleDeleteAsset = useCallback((id: string) => {
    setGalleryAssets((prev) => prev.filter((a) => a.id !== id));
    void deleteAsset(id);
  }, []);

  // Re-Prompt: aktiviert das passende Tool + kopiert den Prompt in die Zwischenablage
  const handleRePrompt = useCallback((prompt: string, tool: string) => {
    const found = Object.entries(TOOL_LABEL).find(([, label]) => label === tool);
    if (found) setActiveTool(found[0] as ToolId);
    navigator.clipboard.writeText(prompt).catch(() => {});
  }, []);

  // ── SettingsPanel — ref (für API-Calls, kein Re-render) + state (für AgentBox) ──
  const toolSettingsRef                   = useRef<ToolSettings | null>(null);
  const [toolSettings, setToolSettings]   = useState<ToolSettings | null>(null);

  // Rechtes Panel automatisch öffnen/schließen
  useEffect(() => {
    setIsRightPanel(TOOLS_WITH_RIGHT_PANEL.has(activeTool));
  }, [activeTool]);

  // Settings-Änderungen vom SettingsPanel empfangen (ref + state synchron)
  const handleSettingsChange = useCallback((settings: ToolSettings) => {
    toolSettingsRef.current = settings;
    setToolSettings(settings);
  }, []);

  // ── AgentBox Callback ─────────────────────────────────────────────────────
  //
  // TEXT-TOOLS: /api/agent zieht bereits 1 Credit ab → skipDeduction: true
  //             Wir speichern nur das Asset in die DB.
  //
  // MEDIEN-TOOLS: Mock-Pfad (noch kein echter API-Call) → skipDeduction: true,
  //               damit kein Credit-Abzug für nicht-funktionale Placeholder-Outputs.
  //               Echte Calls (img-to-img, etc.) setzen ihren eigenen skipDeduction-Wert.
  //
  const handleActionExecute = useCallback(
    async (tool: ToolId, payload: string) => {

      // ── TEXT-TOOLS ────────────────────────────────────────────────────────
      if (TEXT_TOOLS.has(tool)) {
        setToolGenerating(tool, true);
        try {
          // Optimistisches UI-Update: Asset sofort zeigen
          const optimisticItem: GalleryItem = {
            id:        `opt-${Date.now()}`,
            type:      "text",
            content:   payload,
            prompt:    TOOL_LABEL[tool],
            tool:      TOOL_LABEL[tool],
            createdAt: new Date().toISOString(),
          };
          setGalleryAssets((prev) => [optimisticItem, ...prev]);
          // Credits lokal abziehen (1 Credit, gleich wie ORCHESTRATOR_BASE_COST)
          setCredits((c) => Math.max(0, c - 1));

          // Asset in DB speichern (Credits bereits von /api/agent abgezogen)
          const saved = await saveAsset({
            type:          "text",
            content:       payload,
            prompt:        TOOL_LABEL[tool],
            tool:          TOOL_LABEL[tool],
            cost:          1,
            skipDeduction: true,    // /api/agent hat bereits deductCredits() aufgerufen
          });

          if (saved) {
            // Optimistisches Item durch echtes DB-Item ersetzen
            setGalleryAssets((prev) =>
              prev.map((a) => a.id === optimisticItem.id ? saved.asset : a)
            );
            setCredits(saved.remainingCredits);
          }
        } finally {
          setToolGenerating(tool, false);
        }
        return;
      }

      // ── MEDIEN-TOOLS ──────────────────────────────────────────────────────
      const settings = toolSettingsRef.current;
      const cost     = calculateExactCredits(tool, settings as unknown as Record<string, unknown>);

      const settingsSummary = settings
        ? Object.entries(settings)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k}:${String(v)}`)
            .join(" · ")
        : "";

      const toolLabel = `${TOOL_LABEL[tool]}${settingsSummary ? ` · ${settingsSummary}` : ""}`;
      const isImageTool = ["image-gen", "img-to-img", "face-swap-image", "char-studio-image"].includes(tool);

      setToolGenerating(tool, true);
      setIsGalleryLoading(true);

      try {
        // ── img-to-img: echter /api/generate-image-Call mit variation:true ──────
        if (tool === "img-to-img") {
          const res = await fetch("/api/generate-image", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ prompt: payload, ...(settings as object), variation: true }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({})) as { error?: string };
            throw new Error(errData.error ?? `HTTP ${res.status}`);
          }
          const data = await res.json() as { imageUrl?: string; creditsLeft?: number };
          if (!data.imageUrl) throw new Error("Keine Bild-URL in der Antwort");
          // /api/generate-image hat deductCredits() bereits aufgerufen → skipDeduction:true
          const saved = await saveAsset({
            type:          "image",
            url:           data.imageUrl,
            prompt:        payload,
            tool:          toolLabel,
            cost:          0,
            skipDeduction: true,
          });
          if (saved) {
            setGalleryAssets((prev) => [saved.asset, ...prev]);
            setCredits(saved.remainingCredits);
          } else {
            setGalleryAssets((prev) => [{
              id:        Date.now().toString(),
              type:      "image",
              url:       data.imageUrl!,
              prompt:    payload,
              tool:      toolLabel,
              createdAt: new Date().toISOString(),
            }, ...prev]);
            if (typeof data.creditsLeft === "number") setCredits(data.creditsLeft);
          }
          return;
        }

        // ── Mock für alle anderen Medien-Tools (TODO: durch echte Calls ersetzen) ─
        await new Promise<void>((resolve) => setTimeout(resolve, 3000));
        const placeholderUrl = isImageTool
          ? "https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=800&q=80"
          : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

        // Asset speichern — KEIN Credit-Abzug für Mock-Placeholder
        // (echter Abzug erfolgt erst wenn der echte API-Call aktiviert wird)
        const saved = await saveAsset({
          type:          isImageTool ? "image" : "video",
          url:           placeholderUrl,
          prompt:        payload,
          tool:          toolLabel,
          cost:          0,
          skipDeduction: true,    // kein Abzug für nicht-funktionale Mock-Outputs
        });

        if (saved) {
          setGalleryAssets((prev) => [saved.asset, ...prev]);
          setCredits(saved.remainingCredits);
        } else {
          // Fallback: lokales Item wenn API-Save fehlschlägt
          setGalleryAssets((prev) => [{
            id:        Date.now().toString(),
            type:      isImageTool ? "image" : "video",
            url:       placeholderUrl,
            prompt:    payload,
            tool:      toolLabel,
            createdAt: new Date().toISOString(),
          }, ...prev]);
          // cost=0 für Mock → keine lokale Credit-Anpassung nötig
        }

      } catch (err) {
        console.error("[Media API] Fehler:", err);
      } finally {
        setToolGenerating(tool, false);
        setIsGalleryLoading(false);
      }
    },
    // toolSettingsRef ist ein ref → kein Dep nötig
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="flex min-h-screen" style={{ background: "#000000" }}>

      {/* ── Left Sidebar ──────────────────────────────────────────────────────── */}
      <LeftSidebar
        activeTool={activeTool}
        credits={credits}
        creditsLoaded={creditsLoaded}
        toolsGenerating={toolsGenerating}
        onSelect={setActiveTool}
      />

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <main
        className={`ml-[240px] flex h-screen flex-1 flex-col overflow-y-auto transition-all duration-200 ${
          isRightPanelOpen ? "mr-[280px]" : "mr-0"
        }`}
        style={{
          background:     "#000000",
          scrollbarWidth: "none",
        }}
      >
        {/* Studio Home hat eigenes breiteres Layout */}
        {activeTool === "studio" ? (
          <div className="mx-auto w-full max-w-4xl px-10 pb-12 pt-14">
            <StudioHome onSelect={setActiveTool} />
          </div>
        ) : (
        <div className="mx-auto flex w-full max-w-xl flex-col pt-8 pb-12">

          {activeTool === "settings" ? (

            /* ── EINSTELLUNGEN: nur Header + SettingsView ──────────────────── */
            <>
              <WelcomeBar activeTool={activeTool} />
              <SettingsView credits={credits} creditsLoaded={creditsLoaded} />
            </>

          ) : activeTool === "gallery" ? (

            /* ── GALERIE: kein AgentBox, Grid nimmt vollen Raum ───────────── */
            <>
              <WelcomeBar activeTool={activeTool} />
              <GalleryFilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
              />
              <div className="mt-4">
                <GalleryOrEmpty
                  filteredAssets={filteredAssets}
                  isGalleryLoading={isGalleryLoading}
                  searchQuery={searchQuery}
                  onRePrompt={handleRePrompt}
                  onDeleteAsset={handleDeleteAsset}
                  onResetFilter={() => { setSearchQuery(""); setActiveFilter("all"); }}
                />
              </div>
            </>

          ) : (

            /* ── TOOL: Floating AgentBox (fixed) + Gallery darunter ──────── */
            <>
              {/* Spacer für das fixierte Floating-Panel */}
              <div className="h-56" />
              <WelcomeBar activeTool={activeTool} />
              <AgentBox
                activeTool={activeTool}
                toolSettings={toolSettings as unknown as Record<string, unknown> | null}
                currentCredits={credits}
                onActionExecute={handleActionExecute}
                onNavigate={setActiveTool}
              />
              <div className="mt-16">
                <GalleryFilterBar
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                />
                <div className="mt-4">
                  <GalleryOrEmpty
                    filteredAssets={filteredAssets}
                    isGalleryLoading={isGalleryLoading}
                    searchQuery={searchQuery}
                    onRePrompt={handleRePrompt}
                    onDeleteAsset={handleDeleteAsset}
                    onResetFilter={() => { setSearchQuery(""); setActiveFilter("all"); }}
                  />
                </div>
              </div>
              {!creditsLoaded && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 size={14} className="animate-spin text-white/20" />
                  <span className="text-[12px] text-white/25">Konto wird geladen…</span>
                </div>
              )}
            </>

          )}
        </div>
        )}
      </main>

      {/* ── Right Settings Panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isRightPanelOpen && (
          <motion.aside
            key="right-panel"
            initial={{ x: 280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 280, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed right-0 top-0 z-20 h-screen w-[280px]"
            style={{
              background:  "#0d0d0d",
              borderLeft:  "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <SettingsPanel
              activeTool={activeTool}
              onSettingsChange={handleSettingsChange}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
