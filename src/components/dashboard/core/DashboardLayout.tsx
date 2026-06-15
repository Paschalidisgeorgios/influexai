"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AgentBox } from "./AgentBox";
import { SettingsPanel, type ToolSettings } from "./SettingsPanel";
import { SettingsView } from "./SettingsView";
import { DashboardSectionHeader } from "@/components/dashboard/ui/DashboardSectionHeader";
import { DashboardCard }          from "@/components/dashboard/ui/DashboardCard";
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
  Languages,

  Clapperboard,
  ShoppingBag,
  Layers,
  Volume2,
  Camera,
  Bot,
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
      { id: "viral-hook",       label: "Viral Hook",           icon: <Zap size={14} />,          accent: "#b4ff00" },
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
      { id: "face-swap-video",   label: "Gesichtstausch",       icon: <Shuffle size={14} />,       accent: "#FF6B6B", badge: "new"       },
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
      { id: "image-gen",         label: "Bildgenerator",        icon: <Image size={14} />,         accent: "#8B5DFF" },
      { id: "img-to-img",        label: "Bild zu Bild",         icon: <Repeat2 size={14} />,       accent: "#8B5DFF" },
    ],
  },
  {
    title: "Audio Tools",
    items: [
      { id: "tts",           label: "Melodia Studio",     icon: <Volume2 size={14} />, accent: "#00D5FF" },
    ],
  },
];
// "Live & Akool" section removed [v10]: live-camera + streaming-avatar hidden pending
// dedicated Agora-SDK UI. APIs remain fully functional (/api/live-avatar/session + heartbeat).

const NAV_BOTTOM: NavItem[] = [
  { id: "gallery",  label: "Galerie",       icon: <Images size={14} />,   accent: "#b4ff00" },
  { id: "settings", label: "Einstellungen", icon: <Settings size={14} />, accent: "#b4ff00" },
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
  const color = low ? "#ff4444" : "#b4ff00";
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
                  borderLeft:  isActive ? "2px solid #b4ff00" : "2px solid transparent",
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
                            borderLeft:  active ? "2px solid #b4ff00" : "2px solid transparent",
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
              borderLeft:  activeTool === "studio" ? "2px solid #b4ff00" : "2px solid transparent",
              paddingLeft: activeTool === "studio" ? "calc(0.75rem - 2px)" : "0.75rem",
            }}
          >
            <Layers size={14} style={{ color: activeTool === "studio" ? "#b4ff00" : "rgba(255,255,255,0.25)" }} />
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
  id:          ToolId;
  eyebrow:     string;
  cta:         string;
  sub:         string;
  imgUrl?:     string;
  accentGlow?: string;
  bgGradient?: string;
  grid?:       boolean;
}

const HERO_CARDS: HeroCard[] = [
  {
    id:         "img-to-video",
    eyebrow:    "Video",
    cta:        "AD FLOW →",
    sub:        "Build ads on one visual canvas",
    // Dark abstract film/light-rays — no cinema screen visible
    imgUrl:     "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=900&q=70",
    accentGlow: "#b4ff00",
  },
  {
    id:      "avatar-video",
    eyebrow: "Avatar",
    cta:     "AVATAR VIDEO →",
    sub:     "Create talking videos with AI actors",
    // Local avatar asset — person/face, perfect for "talking AI actors"
    imgUrl:  "/avatars/avatar-1.jpg",
  },
  {
    id:         "viral-hook",
    eyebrow:    "AI Agent",
    cta:        "AI MEDIA BUYER →",
    sub:        "Your copilot across every ad account",
    grid:       true,
    // Dark navy gradient — suggests tech/data without a photo
    bgGradient: "linear-gradient(135deg, #070d1f 0%, #0b0b12 60%, #080810 100%)",
    accentGlow: "#0055ff",
  },
];

interface SmallCard {
  id:      ToolId;
  label:   string;
  desc:    string;
  icon:    React.ReactNode;
  badge?:  BadgeVariant;
  credits: number;
}

const SMALL_CARDS_CREATE: SmallCard[] = [
  { id: "image-gen",     label: "Asset Generator", desc: "From concept to campaign visual in seconds",   icon: <Image size={13} />,   badge: "hot", credits: 3  },
  { id: "ecommerce-ads", label: "Video Ad",         desc: "AI-powered campaign video via Akool",          icon: <Video size={13} />,   badge: "new", credits: 15 },
  { id: "img-to-img",    label: "Image Ad",          desc: "Transform images with AI variation",          icon: <Images size={13} />,               credits: 3  },
];

const SMALL_CARDS_ANALYZE: SmallCard[] = [
  { id: "viral-hook",       label: "Viral Hook",       desc: "5 scroll-stopping hooks via Claude",    icon: <Zap size={13} />,        credits: 1 },
  { id: "content-calendar", label: "Content Calendar", desc: "7-day platform-ready calendar",         icon: <Calendar size={13} />,   credits: 2 },
  { id: "trend-script",     label: "Trend Script",     desc: "Script built from trending content",    icon: <TrendingUp size={13} />, credits: 3 },
];

const WORKFLOW_STEPS = [
  { num: "01", label: "Idea"     },
  { num: "02", label: "Brand"    },
  { num: "03", label: "Generate" },
  { num: "04", label: "Review"   },
  { num: "05", label: "Export"   },
] as const;

function StudioHome({
  onSelect,
  credits,
  creditsLoaded,
  recentAssets,
}: {
  onSelect:      (id: ToolId) => void;
  credits:       number;
  creditsLoaded: boolean;
  recentAssets:  GalleryItem[];
}) {
  return (
    <div className="relative w-full space-y-8">

      {/* Layered ambient glows — lime top-centre + blue right — create depth without neon */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-[0.08] blur-[100px]"
        style={{ background: "#b4ff00" }}
      />
      <div
        className="pointer-events-none absolute top-64 right-0 h-[400px] w-[400px] rounded-full opacity-[0.035] blur-[120px]"
        style={{ background: "#0055ff" }}
      />

      {/* ── 1. Studio Header ──────────────────────────────────────────────── */}
      <DashboardSectionHeader
        eyebrow="Creator Studio"
        title="What are you making today?"
        description="Generate campaign-ready images, videos and creator assets from one place."
        action={
          creditsLoaded ? (
            <div className="flex shrink-0 items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-2.5">
              <div className="text-center">
                <p className="font-mono text-sm font-bold text-[#b4ff00]">{credits}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-widest text-zinc-600">Credits</p>
              </div>
              {recentAssets.length > 0 && (
                <>
                  <div className="h-6 w-px bg-white/[0.06]" />
                  <div className="text-center">
                    <p className="font-mono text-sm font-bold text-white">{recentAssets.length}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-widest text-zinc-600">Assets</p>
                  </div>
                </>
              )}
            </div>
          ) : undefined
        }
      />

      {/* ── 2. Bento Hero Grid ────────────────────────────────────────────── */}
      {/* Ad Flow takes 2/3 width; Avatar + Agent stack in the remaining 1/3 */}
      <div className="flex gap-3" style={{ minHeight: "380px" }}>

        {/* Large feature card — Ad Flow */}
        {(() => {
          const card = HERO_CARDS[0];
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              whileHover="hover"
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.22 }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.05] text-left shadow-[0_4px_32px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#b4ff00]/20 hover:shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
              style={{ flex: 2, background: "#0C0C0E" }}
            >
              {card.imgUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.imgUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 transition-opacity duration-500 group-hover:opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/[0.06]" />
                </>
              )}
              {card.accentGlow && (
                <div
                  className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full opacity-[0.20] blur-3xl transition-opacity duration-500 group-hover:opacity-35"
                  style={{ background: card.accentGlow }}
                />
              )}
              <motion.div
                variants={{ hover: { opacity: 1 } }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent"
              />
              <div className="relative z-10 flex h-full flex-col justify-between p-7">
                <span className="w-fit rounded-full border border-white/[0.08] bg-black/40 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45 backdrop-blur-sm">
                  {card.eyebrow}
                </span>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-white">{card.cta}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-neutral-400">{card.sub}</p>
                  <div className="mt-4 flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#b4ff00]/60">Open Studio</span>
                    <ChevronRight size={11} className="text-[#b4ff00]/40" />
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })()}

        {/* Right column — Avatar Video + AI Media Buyer stacked */}
        <div className="flex flex-1 flex-col gap-3">
          {HERO_CARDS.slice(1).map((card) => (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              whileHover="hover"
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.22 }}
              className="group relative flex-1 cursor-pointer overflow-hidden rounded-2xl border border-white/[0.05] text-left shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/[0.12] hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              style={{ background: card.bgGradient ?? "#0C0C0E" }}
            >
              {card.imgUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.imgUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity duration-500 group-hover:opacity-55" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/[0.05]" />
                </>
              )}
              {card.grid && (
                <>
                  <div className="absolute inset-0 opacity-[0.07]" style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }} />
                  <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-3xl" style={{ background: "white" }} />
                </>
              )}
              {/* Accent glow — colour per-card (lime for Avatar, blue for Agent) */}
              {card.accentGlow && (
                <div
                  className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full opacity-[0.22] blur-2xl transition-opacity duration-500 group-hover:opacity-35"
                  style={{ background: card.accentGlow }}
                />
              )}
              <motion.div
                variants={{ hover: { opacity: 1 } }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent"
              />
              <div className="relative z-10 flex h-full flex-col justify-between p-6">
                <span className="w-fit rounded-full border border-white/[0.08] bg-black/40 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45 backdrop-blur-sm">
                  {card.eyebrow}
                </span>
                <div>
                  <p className="text-base font-semibold tracking-tight text-white">{card.cta}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">{card.sub}</p>
                  <div className="mt-3 flex items-center gap-1">
                    <span className="text-[10px] text-white/25">Open</span>
                    <ChevronRight size={10} className="text-white/20" />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

      </div>

      {/* ── 3. Workflow Strip ─────────────────────────────────────────────── */}
      {/* Premium stage indicator — thin lime accent line at top, first step highlighted */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.01]">
        {/* Lime top-accent hairline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b4ff00]/25 to-transparent" />
        <div className="flex items-center px-6 py-4">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[8px] transition-colors ${
                  i === 0
                    ? "border border-[#b4ff00]/30 bg-[#b4ff00]/10 text-[#b4ff00]"
                    : "border border-white/[0.08] text-white/25"
                }`}>
                  {step.num}
                </span>
                <span className={`text-[11px] font-medium tracking-wide ${i === 0 ? "text-zinc-300" : "text-zinc-600"}`}>
                  {step.label}
                </span>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className="mx-4 h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Tool Categories ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-8">

        {/* More ways to create */}
        <div>
          <div className="mb-4">
            <DashboardSectionHeader eyebrow="Studio" title="More ways to create" />
          </div>
          <div className="space-y-1.5">
            {SMALL_CARDS_CREATE.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect(card.id)}
                className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3.5 text-left transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.03]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition-colors group-hover:text-zinc-200">
                  {card.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-zinc-200 transition-colors group-hover:text-white">{card.label}</p>
                  <p className="mt-0.5 truncate text-[10px] text-zinc-500 transition-colors group-hover:text-zinc-400">{card.desc}</p>
                </div>
                {card.badge && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold ${BADGE_STYLE[card.badge]}`}>
                    {BADGE_LABEL[card.badge]}
                  </span>
                )}
                <span className="shrink-0 font-mono text-[10px] text-zinc-600">~{card.credits}cr</span>
                <ChevronRight size={11} className="shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Analyze & launch */}
        <div>
          <div className="mb-4">
            <DashboardSectionHeader eyebrow="Analytics" title="Analyze &amp; launch" />
          </div>
          <div className="space-y-1.5">
            {SMALL_CARDS_ANALYZE.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect(card.id)}
                className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3.5 text-left transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.03]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition-colors group-hover:text-zinc-200">
                  {card.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-zinc-200 transition-colors group-hover:text-white">{card.label}</p>
                  <p className="mt-0.5 truncate text-[10px] text-zinc-500 transition-colors group-hover:text-zinc-400">{card.desc}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-zinc-600">~{card.credits}cr</span>
                <ChevronRight size={11} className="shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── 5. Recent Outputs — only shown when real assets exist ─────────── */}
      {recentAssets.length > 0 && (
        <div>
          <div className="mb-4">
            <DashboardSectionHeader title="Recent outputs" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recentAssets.slice(0, 3).map((asset) => (
              <div
                key={asset.id}
                className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-zinc-950/40"
                style={{ aspectRatio: "16/9" }}
              >
                {asset.url && asset.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt={asset.prompt.slice(0, 40)} className="h-full w-full object-cover opacity-80" />
                ) : asset.url && asset.type === "video" ? (
                  <video src={asset.url} className="h-full w-full object-cover opacity-80" muted playsInline />
                ) : (
                  <div className="flex h-full items-center justify-center p-3">
                    <p className="line-clamp-4 text-center text-[10px] leading-relaxed text-zinc-500">
                      {asset.content ?? asset.prompt}
                    </p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                  <p className="truncate font-mono text-[9px] text-zinc-500">{asset.tool}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
  const router = useRouter();
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

  // Tool-Auswahl — bestimmte Tools leiten zu fertigen dedizierten Seiten weiter
  // statt den AgentBox-Mock zu öffnen.
  const handleToolSelect = useCallback((id: ToolId) => {
    if (id === "img-to-video") {
      router.push("/dashboard/szenen-generator");
      return;
    }
    // face-studio vereint beide Tabs (Video + Foto) — keine URL-Parameter da
    // face-studio/page.tsx nur lokalen useState nutzt (kein useSearchParams)
    if (id === "face-swap-video" || id === "face-swap-image") {
      router.push("/dashboard/face-studio");
      return;
    }
    if (id === "talking-photo") {
      router.push("/dashboard/live-portrait");
      return;
    }
    if (id === "talking-avatar") {
      router.push("/dashboard/lipsync-studio");
      return;
    }
    // character-swap und char-studio-video sind Sidebar-Duplikate derselben Funktion
    // (/dashboard/character-studio, /api/akool/character-studio) — beide Einträge
    // leiten auf dieselbe Seite. char-studio-image ebenfalls.
    if (id === "character-swap" || id === "char-studio-video" || id === "char-studio-image") {
      router.push("/dashboard/character-studio");
      return;
    }
    if (id === "avatar-video") {
      router.push("/dashboard/avatar-studio");
      return;
    }
    if (id === "video-translation") {
      router.push("/dashboard/video-translation");
      return;
    }
    if (id === "live-face-swap") {
      router.push("/dashboard/face-studio");
      return;
    }
    // melodia vereint tts/voice-clone/voice-changer als Tabs — kein useSearchParams,
    // alle drei landen auf Default-Tab "tts". Nutzer muss ggf. Tab manuell wechseln.
    if (id === "tts" || id === "voice-clone" || id === "voice-changer") {
      router.push("/dashboard/melodia");
      return;
    }
    setActiveTool(id);
  }, [router]);

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
        onSelect={handleToolSelect}
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
          <div className="mx-auto w-full max-w-6xl px-8 pb-14 pt-12">
            <StudioHome
              onSelect={handleToolSelect}
              credits={credits}
              creditsLoaded={creditsLoaded}
              recentAssets={galleryAssets}
            />
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
