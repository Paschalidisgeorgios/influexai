"use client";

/**
 * StudioCockpit — Übersicht ohne Agent-Copilot.
 * Zeigt echte Daten (Credits, Assets, laufende Tools) oder klare Empty States.
 */

import Link from "next/link";
import {
  ImageIcon,
  Film,
  Zap,
  Calendar,
  UserRound,
  Bot,
  CreditCard,
  AlertCircle,
  Palette,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { ToolId } from "./DashboardLayout";
import type { GalleryItem } from "./GalleryGrid";
import { getCreditAffordanceAmount } from "@/lib/tools/credit-display";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPageHeader,
  DashboardPanel,
} from "./DashboardSurface";

interface QuickAction {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "image-gen", label: "Bild erstellen", icon: <ImageIcon size={14} /> },
  { id: "img-to-video", label: "Video erstellen", icon: <Film size={14} /> },
  { id: "viral-hook", label: "Hook schreiben", icon: <Zap size={14} /> },
  { id: "content-calendar", label: "Kampagne planen", icon: <Calendar size={14} /> },
  { id: "avatar-video", label: "Avatar Studio", icon: <UserRound size={14} /> },
];

interface StudioCockpitProps {
  onSelect: (id: ToolId) => void;
  credits: number;
  creditsLoaded: boolean;
  recentAssets: GalleryItem[];
  toolsGenerating: Partial<Record<ToolId, boolean>>;
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
      {children}
    </p>
  );
}

export function StudioCockpit({
  onSelect,
  credits,
  creditsLoaded,
  recentAssets,
  toolsGenerating,
}: StudioCockpitProps) {
  const activeJobs = Object.entries(toolsGenerating).filter(([, v]) => v);
  const lastAsset = recentAssets[0];

  return (
    <div className="relative w-full space-y-6 md:space-y-8">
      <DashboardPageHeader
        kicker="Creator Studio"
        title="Studio"
        subtitle="Überblick über Produktionen, Assets und Credits."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
        <DashboardPanel title="Aktive Produktionen">
          {activeJobs.length > 0 ? (
            <ul className="space-y-2">
              {activeJobs.map(([toolId]) => (
                <li
                  key={toolId}
                  className="flex items-center gap-2 text-[12px]"
                  style={{ color: DASHBOARD_TEXT }}
                >
                  <Loader2 size={12} className="animate-spin" style={{ color: DASHBOARD_ACCENT }} />
                  <span>{toolId}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint>Keine laufenden Generierungen.</EmptyHint>
          )}
        </DashboardPanel>

        <DashboardPanel title="Letzte Assets">
          {recentAssets.length > 0 ? (
            <div className="space-y-2">
              {recentAssets.slice(0, 3).map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelect("gallery")}
                  className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-black/[0.04]"
                >
                  <span className="truncate text-[12px]" style={{ color: DASHBOARD_TEXT }}>
                    {asset.tool || asset.prompt.slice(0, 40)}
                  </span>
                  <ChevronRight size={11} className="shrink-0" style={{ color: DASHBOARD_MUTED }} />
                </button>
              ))}
              <Link
                href="/dashboard/gallery"
                className="mt-1 inline-flex items-center gap-1 text-[11px] hover:opacity-80"
                style={{ color: DASHBOARD_MUTED }}
              >
                Alle in Galerie
                <ChevronRight size={10} />
              </Link>
            </div>
          ) : (
            <EmptyHint>
              Noch keine Assets. Starte eine Generierung im Agent oder einem Tool.
            </EmptyHint>
          )}
        </DashboardPanel>

        <DashboardPanel title="Credits & Plan">
          {creditsLoaded ? (
            <div className="space-y-2">
              <p className="text-[13px]" style={{ color: DASHBOARD_TEXT }}>
                <span className="font-mono font-semibold" style={{ color: DASHBOARD_ACCENT }}>
                  {credits}
                </span>{" "}
                Credits verfügbar
              </p>
              <Link
                href="/dashboard/credits"
                className="inline-flex items-center gap-1 text-[11px] hover:opacity-80"
                style={{ color: DASHBOARD_MUTED }}
              >
                <CreditCard size={11} />
                Credits & Plan verwalten
              </Link>
            </div>
          ) : (
            <div
              className="h-10 animate-pulse rounded"
              style={{ background: "rgba(8,8,8,0.06)" }}
            />
          )}
        </DashboardPanel>

        <DashboardPanel title="Schnell starten">
          <div className="flex flex-wrap gap-2.5">
            {QUICK_ACTIONS.map((action) => {
              const cost = getCreditAffordanceAmount(action.id);
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onSelect(action.id)}
                  className="flex min-h-[44px] min-w-[9rem] flex-1 items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[12px] font-medium transition-colors hover:border-[#b4ff00]/30"
                  style={{
                    borderColor: "rgba(8,8,8,0.12)",
                    background: "#FFFCF7",
                    color: DASHBOARD_TEXT,
                  }}
                >
                  <span style={{ color: DASHBOARD_MUTED }}>{action.icon}</span>
                  {action.label}
                  {cost > 0 && (
                    <span className="font-mono text-[9px]" style={{ color: DASHBOARD_MUTED }}>
                      ~{cost}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Weiterarbeiten" className="border-[#b4ff00]/15">
        {lastAsset ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[12px]" style={{ color: DASHBOARD_MUTED }}>
                Letztes Asset
              </p>
              <p className="truncate text-[13px] font-medium" style={{ color: DASHBOARD_TEXT }}>
                {lastAsset.tool || lastAsset.prompt.slice(0, 60)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href="/dashboard/ki-agent"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#b4ff00]/30 bg-[#b4ff00]/12 px-3 text-[11px] font-medium"
                style={{ color: DASHBOARD_TEXT }}
              >
                <Bot size={12} style={{ color: DASHBOARD_ACCENT }} />
                Zum Agent
              </Link>
              <Link
                href="/dashboard/gallery"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 text-[11px] hover:opacity-80"
                style={{ borderColor: "rgba(8,8,8,0.12)", color: DASHBOARD_MUTED }}
              >
                Galerie öffnen
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <EmptyHint>
              Gib deine Idee im Agent ein — er wählt Tool und Produktionspfad.
            </EmptyHint>
            <Link
              href="/dashboard/ki-agent"
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#b4ff00]/30 bg-[#b4ff00]/12 px-4 text-[12px] font-medium"
              style={{ color: DASHBOARD_TEXT }}
            >
              <Bot size={13} style={{ color: DASHBOARD_ACCENT }} />
              Idee eingeben
            </Link>
          </div>
        )}
      </DashboardPanel>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardPanel title="Brand Kit">
          <EmptyHint>
            Creator-Profil in{" "}
            <Link
              href="/dashboard/settings"
              className="underline hover:opacity-80"
              style={{ color: DASHBOARD_TEXT }}
            >
              Einstellungen
            </Link>{" "}
            hinterlegen.
          </EmptyHint>
        </DashboardPanel>
        <DashboardPanel title="Workspace">
          <EmptyHint>Workspace-Status folgt in einer späteren Phase.</EmptyHint>
        </DashboardPanel>
        <DashboardPanel title="Exporte">
          <EmptyHint>
            Exporte erscheinen nach Share/Download-Aktionen in der Galerie.
          </EmptyHint>
        </DashboardPanel>
        <DashboardPanel title="Fehlgeschlagene Jobs">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: DASHBOARD_MUTED }} />
            <EmptyHint>
              Keine zentrale Job-Übersicht. Einzelfehler in Tool- und Agent-Ansichten.
            </EmptyHint>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Beliebte Tools">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {[
            { id: "viral-hook" as ToolId, label: "Viral Hook", icon: <Zap size={14} /> },
            { id: "image-gen" as ToolId, label: "Bildgenerator", icon: <Palette size={14} /> },
            { id: "img-to-video" as ToolId, label: "Bild zu Video", icon: <Film size={14} /> },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="flex min-h-[48px] items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left text-[12px] font-medium transition-colors hover:border-[#b4ff00]/28"
              style={{
                borderColor: "rgba(8,8,8,0.11)",
                background: "#FFFCF7",
                color: DASHBOARD_TEXT,
              }}
            >
              <span style={{ color: DASHBOARD_ACCENT }}>{item.icon}</span>
              {item.label}
              <ChevronRight size={11} className="ml-auto" style={{ color: DASHBOARD_MUTED }} />
            </button>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}
