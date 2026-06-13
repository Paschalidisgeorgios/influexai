"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useDashboardV3 } from "@/lib/dashboard-v3/context";
import { useScrollVelocity } from "@/lib/dashboard-v3/useScrollVelocity";
import { WorkspaceMediaReveal } from "./WorkspaceMediaReveal";
import { PromptCapsule } from "./PromptCapsule";
import { PayloadPanel } from "./PayloadPanel";

const CINEMATIC_ROUTES = ["/dashboard/szenen-generator"];

export function WorkspaceCanvas({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCinematic = CINEMATIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  const {
    activeModel,
    theme,
    credits,
    realtimePayload,
    containerRef,
    elementRef,
    setSidebarOpen,
    setModelSheetOpen,
    capsule,
    userName,
  } = useDashboardV3();

  const scrollRef = useRef<HTMLDivElement>(null);

  const onFastScroll = useCallback(() => {
    capsule.showMessage(
      `${userName || "Creator"}, bitte etwas langsamer scrollen.`,
      4000,
      6
    );
  }, [capsule, userName]);

  useScrollVelocity(scrollRef, { onFast: onFastScroll });

  if (!isCinematic) {
    return (
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#070709]">
        <div className="flex items-center justify-between border-b px-4 py-3 lg:px-5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button
            type="button"
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-white/60 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menü"
          >
            ☰
          </button>
          <p className="font-sans text-[12px] text-white/60">
            {pathname === "/dashboard" ? "Agent Autopilot" : "Werkzeug"}
          </p>
          <div
            className="rounded-full border px-3 py-1 font-mono text-[11px]"
            style={{ borderColor: `rgba(${theme.rgb},0.3)`, color: `rgb(${theme.rgb})` }}
          >
            ⚡ {credits} Credits
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <main className="px-4 py-4 sm:px-6 sm:py-5">{children}</main>
        </div>

        <div className="shrink-0 px-4 py-2">
          <PayloadPanel payload={realtimePayload} rgb={theme.rgb} embedded />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden"
      style={{ background: "#070709" }}
    >
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 z-0 rounded-full"
        style={{
          transform: "translate(-50%, -50%)",
          width: "640px",
          height: "420px",
          background: `radial-gradient(ellipse, rgba(${theme.rgb},0.16) 0%, rgba(${theme.rgb},0.06) 40%, transparent 70%)`,
          filter: "blur(70px)",
          transition: "background 1.4s ease",
        }}
      />

      <WorkspaceMediaReveal ref={elementRef} model={activeModel} theme={theme} />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-3.5">
        <button
          type="button"
          className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-white/60 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Menü"
        >
          ☰
        </button>
        <div className="hidden font-sans text-[12px] text-white/60 lg:block">
          Modell{" "}
          <span className="font-medium text-white/85">{activeModel.name}</span>
        </div>
        <button
          type="button"
          className="rounded-full border px-3 py-1 font-mono text-[11px] lg:hidden"
          style={{ borderColor: `rgba(${theme.rgb},0.3)`, color: `rgb(${theme.rgb})` }}
          onClick={() => setModelSheetOpen(true)}
        >
          Modell wählen
        </button>
        <div
          className="hidden rounded-full border px-3 py-1 font-mono text-[11px] lg:block"
          style={{ borderColor: `rgba(${theme.rgb},0.3)`, color: `rgb(${theme.rgb})` }}
        >
          ⚡ {credits} Credits
        </div>
      </div>

      <div className="pointer-events-none absolute top-[38%] left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 text-center">
        <h1 className="font-display text-[clamp(28px,6vw,42px)] leading-none tracking-tight text-white">
          {activeModel.name.toUpperCase()}
        </h1>
      </div>

      <PromptCapsule />
      <PayloadPanel payload={realtimePayload} rgb={theme.rgb} />
    </div>
  );
}
