"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SettingsPanel, type ToolSettings } from "./SettingsPanel";
import { StudioCockpit }          from "./StudioCockpit";
import { DashboardPrimaryNav }    from "./DashboardPrimaryNav";
import { DashboardSecondaryNav }  from "./DashboardSecondaryNav";
import { DashboardMobileNav }     from "./DashboardMobileNav";
import { ProductionToolsOverview } from "./ProductionToolsOverview";
import { ProductionToolLaunch } from "./ProductionToolLaunch";
import { ProductionToolSetup } from "./ProductionToolSetup";
import { SETUP_MVP_TOOL_IDS } from "./production-tool-setup-ui";
import {
  isToolPushSafeToOpen,
  normalizeToolQueryParam,
  resolveToolRoute,
} from "./production-tool-routes";
import {
  getStudioToolByDashboardId,
  resolveStudioToolRoute,
} from "@/lib/tools/studio-tool-registry";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_SHELL_BG,
  DashboardStage,
} from "./DashboardSurface";
import { STUDIO_SHELL_BG } from "../studio-ui/tokens";
import { SidebarCreditsLink } from "../studio-ui";
import { DashboardWebsiteLink } from "./DashboardWebsiteLink";
import { calculateExactCredits } from "@/lib/dashboard/promptOptimizer";
import { GalleryGrid, type GalleryItem } from "./GalleryGrid";
import { AnimatePresence, motion } from "framer-motion";
import {
  Image,
  Video,
  LogOut,
  Search,
  FileText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolId =
  // Navigation & Core
  | "studio"           | "tools"          | "gallery"          | "settings"
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
// Nav data — primary nav lives in DashboardPrimaryNav
// ---------------------------------------------------------------------------

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
// Left Sidebar — Studio-Nav (Studio ≠ Agent)
// ---------------------------------------------------------------------------

function LeftSidebar({
  credits,
  creditsLoaded,
  onSelect,
}: {
  credits: number;
  creditsLoaded: boolean;
  onSelect: (id: ToolId) => void;
}) {
  return (
    <aside
      className="fixed left-0 top-0 z-20 hidden h-screen w-[240px] flex-col border-r md:flex"
      style={{
        background: STUDIO_SHELL_BG,
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Brand ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onSelect("studio")}
        className="mb-5 flex shrink-0 items-center gap-3 px-4 py-5 transition-opacity hover:opacity-90"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(180,255,0,0.22)",
          }}
        >
          <span
            className="text-lg font-black leading-none"
            style={{ color: DASHBOARD_ACCENT }}
          >
            I
          </span>
        </div>
        <span className="text-[14px] font-semibold tracking-wide text-white/90">
          INFLUEX<span className="text-white/55">AI</span>
        </span>
      </button>

      {/* ── Primary Nav ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-1" style={{ scrollbarWidth: "none" }}>
        <DashboardPrimaryNav />
        <DashboardSecondaryNav />
      </nav>

      {/* ── Credits + Website + Logout ─────────────────────────────────────── */}
      <div
        className="shrink-0 px-3 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <SidebarCreditsLink credits={credits} loaded={creditsLoaded} />
        <DashboardWebsiteLink className="mt-1 px-0" />

        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all hover:bg-white/[0.03]"
        >
          <LogOut size={13} className="shrink-0 text-white/25" />
          <span className="text-[11px] text-white/35">Abmelden</span>
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Studio Home — Cockpit (kein Copilot)
// ---------------------------------------------------------------------------

function StudioHome({
  onSelect,
  credits,
  creditsLoaded,
  recentAssets,
  toolsGenerating,
}: {
  onSelect:        (id: ToolId) => void;
  credits:         number;
  creditsLoaded:   boolean;
  recentAssets:    GalleryItem[];
  toolsGenerating: Partial<Record<ToolId, boolean>>;
}) {
  return (
    <StudioCockpit
      onSelect={onSelect}
      credits={credits}
      creditsLoaded={creditsLoaded}
      recentAssets={recentAssets}
      toolsGenerating={toolsGenerating}
    />
  );
}

const TOOL_LABEL: Record<ToolId, string> = {
  // Navigation & Core
  "studio":              "Studio",
  "tools":               "Tools",
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

const TOOL_QUERY_IDS = new Set<string>([
  "studio", "tools", "gallery", "settings",
  "viral-hook", "content-calendar", "trend-script",
  "image-gen", "image-generator", "bild-generator",
  "img-to-img", "img-to-video", "video-generator", "szenen-generator",
  "text-to-video", "ecommerce-ads", "avatar-video", "tts",
]);

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

export function DashboardLayout({ bootstrapTool }: { bootstrapTool?: ToolId } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool]         = useState<ToolId>(bootstrapTool ?? "studio");
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
    const toolParam = searchParams.get("tool");
    if (!toolParam) return;

    if (toolParam === "studio") {
      setActiveTool("studio");
      return;
    }
    if (toolParam === "tools") {
      setActiveTool("tools");
      return;
    }
    if (toolParam === "gallery") {
      router.replace("/dashboard/gallery");
      return;
    }
    if (toolParam === "settings") {
      router.replace("/dashboard/settings");
      return;
    }

    const normalized = normalizeToolQueryParam(toolParam);
    if (normalized) {
      setActiveTool(normalized);
      return;
    }

    if (TOOL_QUERY_IDS.has(toolParam)) {
      setActiveTool(toolParam as ToolId);
    }
  }, [searchParams, router]);

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

  // Rechtes Panel — nur für inline AgentBox (entfernt in 2B.3); Launch-Views ohne Panel
  useEffect(() => {
    setIsRightPanel(false);
  }, [activeTool]);

  // Settings-Änderungen vom SettingsPanel empfangen (ref + state synchron)
  const handleSettingsChange = useCallback((settings: ToolSettings) => {
    toolSettingsRef.current = settings;
    setToolSettings(settings);
  }, []);

  // Tool-Auswahl — Phase 2B.4: Launch-View in SPA; keine Legacy-Dedicated-Pages aus Nav
  const handleToolSelect = useCallback((id: ToolId) => {
    if (id === "studio") {
      router.push("/dashboard");
      setActiveTool("studio");
      return;
    }
    if (id === "tools") {
      router.push("/dashboard?tool=tools");
      setActiveTool("tools");
      return;
    }
    if (id === "gallery") {
      router.push("/dashboard/gallery");
      return;
    }
    if (id === "settings") {
      router.push("/dashboard/settings");
      return;
    }

    const studioTool = getStudioToolByDashboardId(id);
    if (studioTool?.openMode === "external_route") {
      router.push(studioTool.route);
      return;
    }

    if (isToolPushSafeToOpen(id)) {
      const dedicated = resolveStudioToolRoute(id) ?? resolveToolRoute(id);
      if (dedicated) {
        router.push(dedicated);
        return;
      }
    }

    router.push(`/dashboard?tool=${encodeURIComponent(id)}`);
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
    <div className="flex min-h-dvh" style={{ background: DASHBOARD_SHELL_BG }}>

      {/* ── Left Sidebar ──────────────────────────────────────────────────────── */}
      <LeftSidebar
        credits={credits}
        creditsLoaded={creditsLoaded}
        onSelect={handleToolSelect}
      />

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <main
        className={`ml-0 flex h-dvh min-w-0 flex-1 flex-col overflow-hidden pb-[5rem] transition-all duration-200 md:ml-[240px] md:pb-0 ${
          isRightPanelOpen ? "md:mr-[280px]" : "mr-0"
        }`}
      >
        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
        {/* Studio Home — breite Premium-Stage */}
        {activeTool === "studio" ? (
          <DashboardStage>
            <StudioHome
              onSelect={handleToolSelect}
              credits={credits}
              creditsLoaded={creditsLoaded}
              recentAssets={galleryAssets}
              toolsGenerating={toolsGenerating}
            />
          </DashboardStage>
        ) : (
          <DashboardStage
            innerClassName={
              SETUP_MVP_TOOL_IDS.has(activeTool)
                ? "lg:px-8 xl:px-10 2xl:px-12"
                : undefined
            }
          >
            {activeTool === "tools" ? (
              <ProductionToolsOverview onSelect={handleToolSelect} />
            ) : SETUP_MVP_TOOL_IDS.has(activeTool) ? (
              <ProductionToolSetup toolId={activeTool} />
            ) : (
              <ProductionToolLaunch toolId={activeTool} />
            )}
          </DashboardStage>
        )}
        </div>
      </main>

      <DashboardMobileNav />

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
