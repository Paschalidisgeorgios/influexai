import type { ReactNode } from "react";

function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-[#0f0f12] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function ViralHookResultSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Pulse className="h-4 w-40" />
      <Card>
        <Pulse className="mb-2 h-3 w-48" />
        <Pulse className="h-6 w-full" />
        <Pulse className="mt-2 h-6 w-[92%]" />
      </Card>
      {["Storytelling", "Warum viral", "Psychologie", "Nische"].map((key) => (
        <Card key={key}>
          <Pulse className="mb-3 h-3 w-36" />
          <Pulse className="h-4 w-full" />
          <Pulse className="mt-2 h-4 w-[88%]" />
          <Pulse className="mt-2 h-4 w-[75%]" />
        </Card>
      ))}
      <div className="flex gap-3">
        <Pulse className="h-12 flex-1" />
        <Pulse className="h-12 w-36" />
      </div>
    </div>
  );
}

export function ContentCalendarResultSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Pulse className="h-4 w-[70%]" />
      <div className="flex gap-2">
        <Pulse className="h-10 w-36" />
        <Pulse className="h-10 w-32" />
      </div>
      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="flex gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Pulse key={i} className="h-3 w-12 shrink-0" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0"
          >
            <Pulse className="h-4 w-8 shrink-0" />
            <Pulse className="h-4 w-16 shrink-0" />
            <Pulse className="h-4 flex-1" />
            <Pulse className="h-4 w-24 shrink-0" />
            <Pulse className="h-8 w-20 shrink-0 rounded-md" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export function TrendScriptResultSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Pulse className="mb-3 h-3 w-32" />
        <Pulse className="h-4 w-full" />
        <Pulse className="mt-2 h-4 w-[90%]" />
        <Pulse className="mt-3 h-4 w-[65%]" />
      </Card>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Pulse className="h-3 w-28" />
          <Pulse className="h-3 w-24" />
        </div>
        {["HOOK", "MAIN", "CTA"].map((block) => (
          <div
            key={block}
            className="mb-3 rounded-xl border border-white/[0.06] bg-[#18181d] p-4 last:mb-0"
          >
            <Pulse className="mb-2 h-3 w-14" />
            <Pulse className="h-4 w-full" />
            <Pulse className="mt-2 h-4 w-[94%]" />
            <Pulse className="mt-2 h-4 w-[80%]" />
          </div>
        ))}
      </Card>
      <div className="flex gap-3">
        <Pulse className="h-12 flex-1" />
        <Pulse className="h-12 w-32" />
      </div>
    </div>
  );
}

export function ProductAdLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        <div className="mx-auto w-full max-w-[360px]">
          <Pulse className="aspect-[9/16] w-full rounded-2xl" />
          <Pulse className="mx-auto mt-3 h-3 w-48" />
          <Pulse className="mt-3 h-12 w-full rounded-xl" />
        </div>
        <Card className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#B4FF00]/20 bg-[#B4FF00]/5 p-4">
            <Pulse className="mb-2 h-3 w-12" />
            <Pulse className="h-7 w-full" />
            <Pulse className="mt-2 h-7 w-[85%]" />
          </div>
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-[92%]" />
          <Pulse className="h-4 w-[88%]" />
          <Pulse className="h-4 w-[70%]" />
        </Card>
      </div>
      <Pulse className="mx-auto h-3 w-56" />
    </div>
  );
}

export function KiAgentRunningSkeleton() {
  return (
    <div
      className="mt-6 overflow-hidden rounded border border-white/[0.08] bg-white/[0.03]"
    >
      <div className="flex">
        <Pulse className="w-[3px] shrink-0 self-stretch rounded-none bg-[#B4FF00]/40" />
        <div className="flex-1 p-4">
          <Pulse className="mb-2 h-4 w-40" />
          <Pulse className="mb-4 h-3 w-[85%]" />
          <div className="mb-4 space-y-2">
            <Pulse className="h-10 w-full" />
            <Pulse className="h-10 w-[92%]" />
            <Pulse className="h-10 w-[78%]" />
          </div>
          {["Hook", "Klarheit", "Platform Fit"].map((label) => (
            <div key={label} className="mb-2.5">
              <div className="mb-1 flex justify-between">
                <Pulse className="h-2.5 w-16" />
                <Pulse className="h-2.5 w-10" />
              </div>
              <Pulse className="h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VoiceGeneratingSkeleton() {
  return (
    <Card className="mt-2 flex flex-col gap-4">
      <Pulse className="h-4 w-32" />
      <Pulse className="h-[72px] w-full rounded-lg" />
      <Pulse className="h-10 w-full rounded-lg" />
      <Pulse className="h-11 w-full rounded-xl" />
    </Card>
  );
}
