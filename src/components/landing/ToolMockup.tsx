"use client";

type ToolMockupProps = {
  variant: "image" | "video" | "agent" | "avatar";
};

export function ToolMockup({ variant }: ToolMockupProps) {
  if (variant === "image") {
    return (
      <div className="flex min-h-[320px] flex-col gap-4">
        <p className="font-mono text-[10px] tracking-wider text-white/25 uppercase">
          Prompt Input
        </p>
        <div className="rounded-lg border border-white/[0.06] bg-black/40 px-4 py-3 text-sm text-white/40">
          Summer campaign hero — marble surface, soft daylight
        </div>
        <p className="font-mono text-[10px] tracking-wider text-white/25 uppercase">
          Output Preview
        </p>
        <div className="flex-1 rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.08] via-transparent to-[#b4ff00]/5" />
      </div>
    );
  }

  if (variant === "video") {
    return (
      <div className="flex min-h-[320px] flex-col gap-4">
        <p className="font-mono text-[10px] tracking-wider text-white/25 uppercase">
          Upload Zone
        </p>
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/30 text-sm text-white/30">
          Drop image to animate
        </div>
        <p className="font-mono text-[10px] tracking-wider text-white/25 uppercase">
          Format
        </p>
        <div className="flex gap-2">
          {["9:16 Reels", "16:9", "1:1"].map((fmt) => (
            <span
              key={fmt}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                fmt.startsWith("9:16")
                  ? "border-[#b4ff00]/40 bg-[#b4ff00]/10 text-[#b4ff00]"
                  : "border-white/10 text-white/35"
              }`}
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "agent") {
    return (
      <div className="flex min-h-[320px] flex-col gap-3">
        <p className="font-mono text-[10px] tracking-wider text-white/25 uppercase">
          Campaign Chat
        </p>
        <div className="rounded-lg border border-white/[0.06] bg-black/30 px-4 py-3 text-sm text-white/50">
          Launch week für neues Produkt — 3 Hooks, 2 Visuals, 1 Reel
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-[#b4ff00]/5 px-4 py-3 text-sm text-white/60">
          Plan erstellt · Generiere Assets…
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          {["Hooks", "Visuals", "Captions"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-5">
      <p className="self-start font-mono text-[10px] tracking-wider text-white/25 uppercase">
        Avatar Preview
      </p>
      <div className="h-28 w-28 rounded-full border border-[#b4ff00]/25 bg-gradient-to-br from-white/10 to-transparent" />
      <div className="flex gap-2">
        {["Lip Sync", "DE Voice", "Scene Swap"].map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-white/10 px-3 py-1 text-xs text-white/40"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
