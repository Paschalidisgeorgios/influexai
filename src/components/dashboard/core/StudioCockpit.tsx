"use client";

/**
 * StudioCockpit — Produktionszentrale mit Video-Hero.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ImageIcon,
  Film,
  Zap,
  Calendar,
  UserRound,
  Bot,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { ToolId } from "./DashboardLayout";
import type { GalleryItem } from "./GalleryGrid";
import { getCreditAffordanceAmount } from "@/lib/tools/credit-display";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "./DashboardSurface";
import { STUDIO_RADIUS, STUDIO_SHADOW } from "../studio-ui";
import { getStageCreditStyles } from "../studio-ui/credit-status";

const STUDIO_VIDEO_WEBM = "/videos/studio/studio-loop.webm";
const STUDIO_VIDEO_MP4 = "/videos/studio/studio-loop.mp4";
const STUDIO_VIDEO_POSTER = "/videos/studio/studio-poster.webp";

interface QuickAction {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "image-gen", label: "Bild erstellen", icon: <ImageIcon size={16} strokeWidth={1.75} /> },
  { id: "img-to-video", label: "Video erstellen", icon: <Film size={16} strokeWidth={1.75} /> },
  { id: "viral-hook", label: "Hook schreiben", icon: <Zap size={16} strokeWidth={1.75} /> },
  { id: "content-calendar", label: "Kampagne planen", icon: <Calendar size={16} strokeWidth={1.75} /> },
  { id: "avatar-video", label: "Avatar Studio", icon: <UserRound size={16} strokeWidth={1.75} /> },
];

interface StudioCockpitProps {
  onSelect: (id: ToolId) => void;
  credits: number;
  creditsLoaded: boolean;
  recentAssets: GalleryItem[];
  toolsGenerating: Partial<Record<ToolId, boolean>>;
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
      {children}
    </p>
  );
}

function StudioVideoHero({ onSelect }: { onSelect: (id: ToolId) => void }) {
  const [posterFailed, setPosterFailed] = useState(false);

  return (
    <section
      className={`relative w-full min-w-0 overflow-hidden ${STUDIO_RADIUS.panel}`}
      style={{ boxShadow: STUDIO_SHADOW.featured }}
      aria-label="Creator Studio"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #E8E0D0 0%, #F2EBE0 45%, #DDD4C4 100%)",
        }}
        aria-hidden
      />

      <video
        className="absolute inset-0 hidden h-full w-full object-cover md:block"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      >
        <source src={STUDIO_VIDEO_WEBM} type="video/webm" />
        <source src={STUDIO_VIDEO_MP4} type="video/mp4" />
      </video>

      {!posterFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={STUDIO_VIDEO_POSTER}
          alt=""
          className="absolute inset-0 h-full w-full object-cover md:hidden"
          onError={() => setPosterFailed(true)}
        />
      ) : null}

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/42 to-black/18 md:bg-gradient-to-r md:from-black/62 md:via-black/38 md:to-black/12"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[240px] max-w-3xl flex-col justify-end px-6 pb-7 pt-14 sm:min-h-[260px] md:min-h-[300px] md:px-10 md:pb-9 md:pt-16 lg:min-h-[320px] lg:px-12">
        <p
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55"
        >
          Creator Studio
        </p>
        <h1
          className="max-w-xl text-[1.65rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-[1.85rem] md:text-[2.15rem]"
          style={{ letterSpacing: "-0.03em" }}
        >
          Dein Creator Studio für Kampagnen, Bilder und Motion.
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/72 md:text-[15px]">
          Starte mit einem Tool oder bereite dein Briefing mit dem Agenten vor.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => onSelect("tools")}
            className={`inline-flex min-h-[44px] items-center justify-center px-6 text-sm font-semibold transition-opacity hover:opacity-90 ${STUDIO_RADIUS.button}`}
            style={{ background: "#FAF6EE", color: "#080808" }}
          >
            Tool auswählen
          </button>
          <Link
            href="/dashboard/ki-agent"
            className={`inline-flex min-h-[44px] items-center justify-center border px-6 text-sm font-medium no-underline transition-colors hover:border-white/35 ${STUDIO_RADIUS.button}`}
            style={{
              borderColor: "rgba(255,255,255,0.22)",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Mit Agent vorbereiten
          </Link>
        </div>
      </div>
    </section>
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
  const creditStyles = creditsLoaded ? getStageCreditStyles(credits) : null;

  return (
    <div className="relative w-full min-w-0 space-y-8 md:space-y-10">
      <StudioVideoHero onSelect={onSelect} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-lg font-bold tracking-tight md:text-xl"
              style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.02em" }}
            >
              Schnell starten
            </h2>
            <p className="mt-1 text-sm" style={{ color: DASHBOARD_MUTED }}>
              Die häufigsten Produktionsschritte — ein Klick zum Tool.
            </p>
          </div>
          {creditsLoaded ? (
            <Link
              href="/dashboard/credits"
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium no-underline transition-colors hover:border-black/12"
              style={{
                borderColor: "rgba(8,8,8,0.08)",
                background: "rgba(255,252,247,0.75)",
                color: DASHBOARD_TEXT,
              }}
            >
              {creditStyles?.showAccentDot ? (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "#b4ff00", opacity: 0.65 }}
                  aria-hidden
                />
              ) : creditStyles?.warnDot ? (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: creditStyles.warnDot }}
                  aria-hidden
                />
              ) : null}
              <span className="font-mono font-semibold tabular-nums">{credits}</span>
              <span style={{ color: DASHBOARD_MUTED }}>Credits</span>
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const cost = getCreditAffordanceAmount(action.id);
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onSelect(action.id)}
                className={`group flex min-h-[58px] items-center gap-3 border px-4 py-3.5 text-left transition-all hover:-translate-y-px hover:border-black/14 hover:shadow-[0_4px_20px_rgba(8,8,8,0.05)] ${STUDIO_RADIUS.input}`}
                style={{
                  borderColor: "rgba(8,8,8,0.08)",
                  background: "rgba(255,252,247,0.92)",
                  color: DASHBOARD_TEXT,
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors group-hover:bg-black/[0.06]"
                  style={{ background: "rgba(8,8,8,0.04)", color: "rgba(8,8,8,0.55)" }}
                >
                  {action.icon}
                </span>
                <span className="min-w-0 flex-1 text-[14px] font-semibold tracking-tight">
                  {action.label}
                </span>
                {cost > 0 ? (
                  <span className="font-mono text-[10px] tabular-nums" style={{ color: DASHBOARD_MUTED }}>
                    ab {cost}
                  </span>
                ) : null}
                <ChevronRight
                  size={14}
                  className="shrink-0 opacity-30 transition-opacity group-hover:opacity-70"
                />
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          <Link
            href="/dashboard?tool=tools"
            className="text-[13px] font-semibold no-underline hover:opacity-80"
            style={{ color: DASHBOARD_TEXT }}
          >
            Alle Tools
          </Link>
          <Link
            href="/dashboard/gallery"
            className="text-[13px] no-underline hover:opacity-80"
            style={{ color: DASHBOARD_MUTED }}
          >
            Galerie
          </Link>
          <Link
            href="/dashboard/ki-agent"
            className="inline-flex items-center gap-1.5 text-[13px] no-underline hover:opacity-80"
            style={{ color: DASHBOARD_MUTED }}
          >
            <Bot size={13} />
            Briefing mit Agent
          </Link>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <div
          className={`p-5 md:p-6 ${STUDIO_RADIUS.panel}`}
          style={{
            background: "rgba(255,252,247,0.55)",
          }}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide" style={{ color: DASHBOARD_MUTED }}>
            Produktion
          </p>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[13px] font-medium" style={{ color: DASHBOARD_TEXT }}>
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
                      <Loader2 size={13} className="animate-spin opacity-60" />
                      <span>{toolId}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Muted>Keine laufenden Generierungen.</Muted>
              )}
            </div>
            <div className="border-t border-black/[0.06] pt-4">
              <p className="mb-2 text-[13px] font-medium" style={{ color: DASHBOARD_TEXT }}>
                Zuletzt erstellt
              </p>
              {recentAssets.length > 0 ? (
                <div className="space-y-1">
                  {recentAssets.slice(0, 4).map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => onSelect("gallery")}
                      className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-black/[0.03]"
                    >
                      <span className="truncate text-[13px]" style={{ color: DASHBOARD_TEXT }}>
                        {asset.tool || asset.prompt.slice(0, 48)}
                      </span>
                      <ChevronRight size={12} className="shrink-0 opacity-40" />
                    </button>
                  ))}
                </div>
              ) : (
                <Muted>Deine Outputs erscheinen hier nach der ersten Generierung.</Muted>
              )}
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col justify-between p-5 md:p-6 ${STUDIO_RADIUS.panel}`}
          style={{
            background: "rgba(255,252,247,0.55)",
          }}
        >
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide" style={{ color: DASHBOARD_MUTED }}>
              Guthaben
            </p>
            {creditsLoaded ? (
              <>
                <p
                  className="font-mono text-4xl font-bold tabular-nums tracking-tight"
                  style={{ color: DASHBOARD_TEXT }}
                >
                  {credits}
                </p>
                <p className="mt-1 text-sm" style={{ color: DASHBOARD_MUTED }}>
                  Credits verfügbar
                </p>
                <Muted>
                  Jede Generierung zeigt die Kosten vor dem Start. Top-up jederzeit möglich.
                </Muted>
              </>
            ) : (
              <div
                className="h-20 animate-pulse rounded-xl"
                style={{ background: "rgba(8,8,8,0.05)" }}
              />
            )}
          </div>
          {creditsLoaded ? (
            <Link
              href="/dashboard/credits"
              className={`mt-6 inline-flex min-h-[44px] w-full items-center justify-center text-[13px] font-semibold no-underline transition-opacity hover:opacity-90 sm:w-auto sm:px-6 ${STUDIO_RADIUS.button}`}
              style={{
                background: "#080808",
                color: "#FAF6EE",
              }}
            >
              Credits verwalten
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
