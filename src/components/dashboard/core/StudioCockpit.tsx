"use client";

/**
 * StudioCockpit — Produktionszentrale ohne Agent-first Copy.
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
import { STUDIO_RADIUS } from "../studio-ui";

interface QuickAction {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "image-gen", label: "Bild erstellen", icon: <ImageIcon size={15} /> },
  { id: "img-to-video", label: "Video erstellen", icon: <Film size={15} /> },
  { id: "viral-hook", label: "Hook schreiben", icon: <Zap size={15} /> },
  { id: "content-calendar", label: "Kampagne planen", icon: <Calendar size={15} /> },
  { id: "avatar-video", label: "Avatar Studio", icon: <UserRound size={15} /> },
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
    <p className="text-[13px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
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

  return (
    <div className="relative w-full min-w-0 space-y-6 md:space-y-8">
      <DashboardPageHeader
        kicker="Creator Studio"
        title="Studio"
        subtitle="Produktionszentrale — Tools direkt starten, Assets und Credits im Blick."
      />

      <DashboardPanel title="Schnell starten">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const cost = getCreditAffordanceAmount(action.id);
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onSelect(action.id)}
                className={`flex min-h-[52px] items-center gap-3 border px-4 py-3 text-left text-[13px] font-medium transition-colors hover:border-[#b4ff00]/30 ${STUDIO_RADIUS.input}`}
                style={{
                  borderColor: "rgba(8,8,8,0.10)",
                  background: "#FFFCF7",
                  color: DASHBOARD_TEXT,
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(180,255,0,0.10)", color: DASHBOARD_ACCENT }}
                >
                  {action.icon}
                </span>
                <span className="min-w-0 flex-1">{action.label}</span>
                {cost > 0 ? (
                  <span className="font-mono text-[10px]" style={{ color: DASHBOARD_MUTED }}>
                    ~{cost}
                  </span>
                ) : null}
                <ChevronRight size={12} className="shrink-0" style={{ color: DASHBOARD_MUTED }} />
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/[0.06] pt-4">
          <Link
            href="/dashboard?tool=tools"
            className="text-[13px] font-medium no-underline hover:opacity-80"
            style={{ color: DASHBOARD_TEXT }}
          >
            Alle Tools ansehen
          </Link>
          <span className="text-black/15">·</span>
          <Link
            href="/dashboard/ki-agent"
            className="inline-flex items-center gap-1.5 text-[13px] no-underline hover:opacity-80"
            style={{ color: DASHBOARD_MUTED }}
          >
            <Bot size={13} />
            Optional: Briefing mit Agent
          </Link>
        </div>
      </DashboardPanel>

      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
        <DashboardPanel title="Produktion">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium" style={{ color: DASHBOARD_MUTED }}>
                Aktiv
              </p>
              {activeJobs.length > 0 ? (
                <ul className="space-y-2">
                  {activeJobs.map(([toolId]) => (
                    <li
                      key={toolId}
                      className="flex items-center gap-2 text-[13px]"
                      style={{ color: DASHBOARD_TEXT }}
                    >
                      <Loader2 size={13} className="animate-spin" style={{ color: DASHBOARD_ACCENT }} />
                      <span>{toolId}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyHint>Keine laufenden Generierungen.</EmptyHint>
              )}
            </div>
            <div className="border-t border-black/[0.06] pt-4">
              <p className="mb-2 text-xs font-medium" style={{ color: DASHBOARD_MUTED }}>
                Zuletzt erstellt
              </p>
              {recentAssets.length > 0 ? (
                <div className="space-y-1.5">
                  {recentAssets.slice(0, 4).map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => onSelect("gallery")}
                      className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                    >
                      <span className="truncate text-[13px]" style={{ color: DASHBOARD_TEXT }}>
                        {asset.tool || asset.prompt.slice(0, 48)}
                      </span>
                      <ChevronRight size={12} className="shrink-0" style={{ color: DASHBOARD_MUTED }} />
                    </button>
                  ))}
                  <Link
                    href="/dashboard/gallery"
                    className="mt-1 inline-flex items-center gap-1 text-[12px] hover:opacity-80"
                    style={{ color: DASHBOARD_MUTED }}
                  >
                    Galerie öffnen
                    <ChevronRight size={10} />
                  </Link>
                </div>
              ) : (
                <EmptyHint>
                  Noch keine Assets. Starte eine Produktion über Schnell starten oder ein Tool.
                </EmptyHint>
              )}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Credits">
          {creditsLoaded ? (
            <div className="space-y-4">
              <p className="text-2xl font-semibold tracking-tight" style={{ color: DASHBOARD_TEXT }}>
                <span className="font-mono" style={{ color: DASHBOARD_ACCENT }}>
                  {credits}
                </span>{" "}
                <span className="text-base font-normal" style={{ color: DASHBOARD_MUTED }}>
                  Credits verfügbar
                </span>
              </p>
              <EmptyHint>
                Credits werden pro Generierung abgerechnet — vor dem Start siehst du die Kosten im Tool.
              </EmptyHint>
              <Link
                href="/dashboard/credits"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-[13px] font-medium no-underline transition-colors hover:border-[#b4ff00]/28"
                style={{
                  borderColor: "rgba(8,8,8,0.12)",
                  background: "#FFFCF7",
                  color: DASHBOARD_TEXT,
                }}
              >
                <CreditCard size={14} style={{ color: DASHBOARD_MUTED }} />
                Credits & Plan verwalten
              </Link>
            </div>
          ) : (
            <div
              className="h-16 animate-pulse rounded-xl"
              style={{ background: "rgba(8,8,8,0.06)" }}
            />
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
