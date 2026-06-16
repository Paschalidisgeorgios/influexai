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
  Package,
  Palette,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { ToolId } from "./DashboardLayout";
import type { GalleryItem } from "./GalleryGrid";
import { getCreditAffordanceAmount } from "@/lib/tools/credit-display";

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

function CockpitCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 ${className}`}
    >
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] leading-relaxed text-zinc-600">{children}</p>
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Studio
          </h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-zinc-500">
            Überblick über Produktionen, Assets und Credits.
          </p>
        </div>
        {creditsLoaded && (
          <Link
            href="/dashboard/credits"
            className="shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 transition-colors hover:border-[#b4ff00]/20"
          >
            <p className="font-mono text-sm font-bold text-[#b4ff00]">{credits}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-widest text-zinc-600">
              Credits · Plan
            </p>
          </Link>
        )}
      </div>

      {/* Cockpit grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
        <CockpitCard title="Aktive Produktionen">
          {activeJobs.length > 0 ? (
            <ul className="space-y-2">
              {activeJobs.map(([toolId]) => (
                <li
                  key={toolId}
                  className="flex items-center gap-2 text-[12px] text-zinc-300"
                >
                  <Loader2 size={12} className="animate-spin text-[#b4ff00]" />
                  <span>{toolId}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint>Keine laufenden Generierungen.</EmptyHint>
          )}
        </CockpitCard>

        <CockpitCard title="Letzte Assets">
          {recentAssets.length > 0 ? (
            <div className="space-y-2">
              {recentAssets.slice(0, 3).map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelect("gallery")}
                  className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span className="truncate text-[12px] text-zinc-300">
                    {asset.tool || asset.prompt.slice(0, 40)}
                  </span>
                  <ChevronRight size={11} className="shrink-0 text-zinc-600" />
                </button>
              ))}
              <Link
                href="/dashboard/gallery"
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300"
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
        </CockpitCard>

        <CockpitCard title="Credits & Plan">
          {creditsLoaded ? (
            <div className="space-y-2">
              <p className="text-[13px] text-zinc-300">
                <span className="font-mono font-semibold text-[#b4ff00]">{credits}</span>{" "}
                Credits verfügbar
              </p>
              <Link
                href="/dashboard/credits"
                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                <CreditCard size={11} />
                Credits & Plan verwalten
              </Link>
            </div>
          ) : (
            <div className="h-10 animate-pulse rounded bg-white/[0.04]" />
          )}
        </CockpitCard>

        <CockpitCard title="Schnell starten">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => {
              const cost = getCreditAffordanceAmount(action.id);
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onSelect(action.id)}
                  className="flex min-h-[40px] items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-zinc-300 transition-colors hover:border-[#b4ff00]/20 hover:text-white"
                >
                  <span className="text-zinc-500">{action.icon}</span>
                  {action.label}
                  {cost > 0 && (
                    <span className="font-mono text-[9px] text-zinc-600">~{cost}</span>
                  )}
                </button>
              );
            })}
          </div>
        </CockpitCard>
      </div>

      {/* Weiterarbeiten */}
      <CockpitCard title="Weiterarbeiten" className="border-[#b4ff00]/10">
        {lastAsset ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[12px] text-zinc-400">Letztes Asset</p>
              <p className="truncate text-[13px] font-medium text-zinc-200">
                {lastAsset.tool || lastAsset.prompt.slice(0, 60)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href="/dashboard/ki-agent"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#b4ff00]/25 bg-[#b4ff00]/10 px-3 text-[11px] font-medium text-[#b4ff00]"
              >
                <Bot size={12} />
                Zum Agent
              </Link>
              <Link
                href="/dashboard/gallery"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 text-[11px] text-zinc-400 hover:text-white"
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
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#b4ff00]/25 bg-[#b4ff00]/10 px-4 text-[12px] font-medium text-[#b4ff00]"
            >
              <Bot size={13} />
              Idee eingeben
            </Link>
          </div>
        )}
      </CockpitCard>

      {/* System status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CockpitCard title="Brand Kit">
          <EmptyHint>
            Creator-Profil in{" "}
            <Link href="/dashboard/settings" className="text-zinc-400 underline hover:text-white">
              Einstellungen
            </Link>{" "}
            hinterlegen.
          </EmptyHint>
        </CockpitCard>
        <CockpitCard title="Workspace">
          <EmptyHint>Workspace-Status folgt in einer späteren Phase.</EmptyHint>
        </CockpitCard>
        <CockpitCard title="Exporte">
          <EmptyHint>
            Exporte erscheinen nach Share/Download-Aktionen in der Galerie.
          </EmptyHint>
        </CockpitCard>
        <CockpitCard title="Fehlgeschlagene Jobs">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-zinc-600" />
            <EmptyHint>
              Keine zentrale Job-Übersicht. Einzelfehler in Tool- und Agent-Ansichten.
            </EmptyHint>
          </div>
        </CockpitCard>
      </div>

      {/* Tool shortcuts — functional, no marketing */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Package size={13} className="text-zinc-600" />
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Tools
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { id: "viral-hook" as ToolId, label: "Viral Hook", icon: <Zap size={13} /> },
            { id: "image-gen" as ToolId, label: "Bildgenerator", icon: <Palette size={13} /> },
            { id: "img-to-video" as ToolId, label: "Bild zu Video", icon: <Film size={13} /> },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.01] px-3 py-2.5 text-left text-[12px] text-zinc-400 transition-colors hover:border-white/[0.1] hover:text-zinc-200"
            >
              {item.icon}
              {item.label}
              <ChevronRight size={11} className="ml-auto text-zinc-700" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
