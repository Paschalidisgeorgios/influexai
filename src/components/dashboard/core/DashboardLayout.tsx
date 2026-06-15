"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AgentBox } from "./AgentBox";
import { SettingsPanel, type ToolSettings } from "./SettingsPanel";
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
  | "gallery"          | "settings"
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
// Left Sidebar
// ---------------------------------------------------------------------------

// Animated credit number — scale-pulse on change
function AnimatedCredits({ credits }: { credits: number }) {
  const low = credits < 10;
  const color = low ? "#ff4444" : "#ccff00";

  return (
    <motion.span
      key={credits}
      initial={{ scale: 1.25, color: "#ccff00" }}
      animate={{ scale: 1,    color }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="font-mono text-[13px] font-semibold"
    >
      {credits}
      <span className="ml-1">⚡</span>
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
  return (
    <aside
      className="fixed left-0 top-0 z-20 flex h-screen w-[260px] flex-col"
      style={{ background: "#111111", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* ── Brand + Credits (fixed top) ──────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 pb-4 pt-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="mb-4 flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "#ccff00" }}
          >
            <span className="text-[10px] font-black leading-none text-black">IX</span>
          </div>
          <span className="text-[13px] font-semibold tracking-wide text-white">
            INFLUEX<span style={{ color: "#ccff00" }}>AI</span>
          </span>
        </div>

        <div
          className="flex items-center justify-between rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <CreditCard size={12} className="text-white/25" />
            <span className="text-[12px] text-white/35">Credits</span>
          </div>
          {creditsLoaded
            ? <AnimatedCredits credits={credits} />
            : <span className="h-4 w-10 animate-pulse rounded bg-white/8" />
          }
        </div>
      </div>

      {/* ── Scrollable Tool Nav ───────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-3 pr-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.08) transparent",
        }}
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            {/* Section heading */}
            <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/18">
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
                    className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all duration-150"
                    style={{
                      background: active ? "rgba(255,255,255,0.08)" : "transparent",
                      borderLeft: active ? `2px solid ${item.accent}` : "2px solid transparent",
                    }}
                  >
                    {/* Icon */}
                    <span
                      className="shrink-0 transition-colors"
                      style={{ color: active ? item.accent : "rgba(255,255,255,0.25)" }}
                    >
                      {item.icon}
                    </span>

                    {/* Label */}
                    <span
                      className="flex-1 truncate text-[12px] transition-colors"
                      style={{ color: active ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.45)" }}
                    >
                      {item.label}
                    </span>

                    {/* Badge (only when idle + not active) */}
                    {item.badge && !generating && !active && (
                      <span
                        className={`shrink-0 rounded px-1 text-[9px] font-semibold leading-[1.6] ${BADGE_STYLE[item.badge]}`}
                      >
                        {BADGE_LABEL[item.badge]}
                      </span>
                    )}

                    {/* Right slot: spinner > chevron > nothing */}
                    {generating ? (
                      <Loader2
                        size={11}
                        className="ml-auto shrink-0 animate-spin"
                        style={{ color: item.accent }}
                      />
                    ) : active ? (
                      <ChevronRight
                        size={10}
                        className="ml-auto shrink-0"
                        style={{ color: item.accent }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom Nav (fixed) ────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-3 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {NAV_BOTTOM.map((item) => {
          const active = activeTool === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all hover:bg-white/5"
              style={{ background: active ? "rgba(255,255,255,0.08)" : "transparent" }}
            >
              <span className="shrink-0" style={{ color: active ? item.accent : "rgba(255,255,255,0.25)" }}>
                {item.icon}
              </span>
              <span className="text-[12px]" style={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.38)" }}>
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all hover:bg-red-500/5"
        >
          <LogOut size={13} className="shrink-0" style={{ color: "rgba(255,255,255,0.18)" }} />
          <span className="text-[12px] text-white/28">Abmelden</span>
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Welcome Bar
// ---------------------------------------------------------------------------

function WelcomeBar({ activeTool }: { activeTool: ToolId }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Gute Nacht" :
    hour < 12 ? "Guten Morgen" :
    hour < 17 ? "Guten Tag" :
    "Guten Abend";

  const allItems = [...NAV_SECTIONS.flatMap((s) => s.items), ...NAV_BOTTOM];
  const tool = allItems.find((t) => t.id === activeTool);

  return (
    <div className="mb-8">
      <h1 className="text-[22px] font-semibold tracking-tight text-white/75">
        {greeting} 👋
      </h1>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-[13px] text-white/30">
          {tool
            ? `Aktives Tool:`
            : "Welches Projekt gehen wir heute an?"}
        </p>
        {tool && (
          <AnimatePresence mode="wait">
            <motion.span
              key={tool.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.15 }}
              className="text-[13px] font-medium"
              style={{ color: tool.accent }}
            >
              {tool.label}
            </motion.span>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

// ─── Tool-ID → Anzeigename (für GalleryItem.tool) ────────────────────────────

const TOOL_LABEL: Record<ToolId, string> = {
  // Navigation & Core
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
  const [activeTool, setActiveTool]         = useState<ToolId>("content-calendar");
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
  // MEDIEN-TOOLS: Kein eigener Credit-Abzug bisher → skipDeduction: false,
  //               cost wird in /api/dashboard/asset server-seitig abgezogen.
  //               Simulierter API-Call (3 s) — durch echten ersetzen wenn bereit.
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
        // ── Ersetze diesen Block durch echten fetch() wenn die Medien-API bereit ist:
        //
        // const endpoint = isImageTool ? "/api/generate-image" : "/api/seedance";
        // const res = await fetch(endpoint, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ prompt: payload, ...settings }),
        // });
        // if (!res.ok) throw new Error(`API error ${res.status}`);
        // const { url } = await res.json() as { url: string };
        //
        await new Promise<void>((resolve) => setTimeout(resolve, 3000));
        const placeholderUrl = isImageTool
          ? "https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=800&q=80"
          : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

        // Asset speichern + Credits serverseitig abziehen
        const saved = await saveAsset({
          type:          isImageTool ? "image" : "video",
          url:           placeholderUrl,
          prompt:        payload,
          tool:          toolLabel,
          cost,
          skipDeduction: false,   // server-side Abzug
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
          setCredits((c) => Math.max(0, c - cost));
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
    <div className="flex min-h-screen" style={{ background: "#0A0A0A" }}>

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
        className={`ml-[260px] flex h-screen flex-1 flex-col overflow-y-auto transition-all duration-200 ${
          isRightPanelOpen ? "mr-[280px]" : "mr-0"
        }`}
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}
      >
        <div className="mx-auto w-full max-w-2xl px-6 py-10">

          {/* Begrüßung */}
          <WelcomeBar activeTool={activeTool} />

          {/* Agent Box — generiert und ruft handleActionExecute; Copilot navigiert via onNavigate */}
          <AgentBox
            activeTool={activeTool}
            toolSettings={toolSettings as unknown as Record<string, unknown> | null}
            currentCredits={credits}
            onActionExecute={handleActionExecute}
            onNavigate={setActiveTool}
          />

          {/* ── Such- & Filterleiste ──────────────────────────────────────── */}
          <div className="mt-10 mb-0 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center w-full">

            {/* Suche */}
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Prompt oder Inhalt suchen…"
                className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs text-neutral-200 placeholder-neutral-500 outline-none transition-colors focus:border-white/10"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              />
            </div>

            {/* Typ-Filter */}
            <div className="flex items-center gap-0.5 rounded-lg p-1"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              {(
                [
                  { id: "all",   label: "Alle",    icon: null },
                  { id: "image", label: "Bilder",  icon: <Image size={11} /> },
                  { id: "video", label: "Videos",  icon: <Video size={11} /> },
                  { id: "text",  label: "Texte",   icon: <FileText size={11} /> },
                ] as const
              ).map(({ id, label, icon }) => {
                const active = activeFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveFilter(id)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition-all ${
                      active
                        ? "bg-neutral-800 text-white font-medium"
                        : "text-white/35 hover:text-white/60 font-normal"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Galerie ───────────────────────────────────────────────────────── */}
          {!isGalleryLoading && filteredAssets.length === 0 ? (
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
              <Search size={22} className="text-white/12" />
              <p className="text-xs text-white/25">
                Keine Assets gefunden, die deiner Suche entsprechen.
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
                  className="mt-1 text-[11px] text-white/20 underline underline-offset-2 transition-colors hover:text-white/40"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          ) : (
            <GalleryGrid
              assets={filteredAssets}
              isLoading={isGalleryLoading}
              onRePrompt={handleRePrompt}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {/* Ladeindikator — während Credits noch nicht aus Supabase geladen ──── */}
          {!creditsLoaded && (
            <div className="mt-10 flex items-center justify-center gap-2 py-4">
              <Loader2 size={14} className="animate-spin text-white/20" />
              <span className="text-[12px] text-white/25">Konto wird geladen…</span>
            </div>
          )}
        </div>
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
              background: "#111111",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* onSettingsChange schreibt direkt in toolSettingsRef */}
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
