"use client";

import dynamic from "next/dynamic";

const LiveCreatorStudioInner = dynamic(
  () =>
    import("./LiveCreatorStudioInner").then((m) => m.LiveCreatorStudioInner),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto flex h-[70vh] max-w-[420px] items-center justify-center rounded-2xl border border-white/10 bg-[#0f0f12] text-white/40 text-sm">
        Live Studio wird geladen…
      </div>
    ),
  }
);

export function LiveCreatorStudio() {
  return <LiveCreatorStudioInner />;
}
