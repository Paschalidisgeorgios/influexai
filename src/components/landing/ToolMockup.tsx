"use client";

type ToolMockupProps = {
  variant: "image" | "video" | "agent" | "avatar";
};

export function ToolMockup({ variant }: ToolMockupProps) {
  if (variant === "image") {
    return (
      <div className="flex h-full min-h-[280px] flex-col gap-4 p-5">
        <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
          <p className="font-mono text-[10px] tracking-wider text-white/30 uppercase">
            Prompt
          </p>
          <p className="mt-2 text-sm text-white/55">
            Summer campaign hero — product on marble, soft daylight
          </p>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-transparent"
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "video") {
    return (
      <div className="flex h-full min-h-[280px] flex-col gap-4 p-5">
        <div className="relative flex-1 overflow-hidden rounded-xl border border-white/[0.06] bg-black/40">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/50">
            <span>Motion draft · 9:16</span>
            <span className="rounded-full bg-[#b4ff00]/15 px-2 py-1 text-[#b4ff00]">
              Rendering
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-white/35">
          <span>Start frame</span>
          <span>Motion prompt</span>
          <span>Export</span>
        </div>
      </div>
    );
  }

  if (variant === "agent") {
    return (
      <div className="flex h-full min-h-[280px] flex-col gap-3 p-5">
        <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
          <p className="font-mono text-[10px] text-white/30 uppercase">Brief</p>
          <p className="mt-2 text-sm text-white/55">
            Launch week · 3 hooks · 2 visuals · 1 reel
          </p>
        </div>
        {["Hook pack", "Visual set", "Posting plan"].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm text-white/50"
          >
            <span>{item}</span>
            <span className="text-[#b4ff00]">Ready</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-5 p-5">
      <div className="h-24 w-24 rounded-full border border-[#b4ff00]/30 bg-gradient-to-br from-white/10 to-transparent" />
      <div className="flex flex-wrap justify-center gap-2">
        {["DE", "EN", "ES", "FR"].map((lang) => (
          <span
            key={lang}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45"
          >
            {lang}
          </span>
        ))}
      </div>
      <p className="text-center text-sm text-white/40">Scene swap · Lip sync · Dubbing</p>
    </div>
  );
}
