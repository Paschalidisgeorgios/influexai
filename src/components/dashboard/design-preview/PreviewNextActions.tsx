"use client";

const ACCENT = "#b4ff00";
const META = "rgba(8,8,8,0.45)";
const BORDER = "rgba(8,8,8,0.08)";

type PreviewNextActionsProps = {
  lang: "de" | "en";
};

const ACTIONS = {
  de: ["Als Video animieren", "Variante erstellen", "In Galerie speichern", "Kampagne daraus planen"],
  en: ["Animate as video", "Create variant", "Save to gallery", "Plan campaign from this"],
} as const;

export function PreviewNextActions({ lang }: PreviewNextActionsProps) {
  const items = ACTIONS[lang];

  return (
    <div className="min-w-0" data-preview-stagger>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: META }}>
        {lang === "de" ? "Nächste Schritte" : "Next actions"}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((label) => (
          <button
            key={label}
            type="button"
            className="rounded border px-3 py-2 text-[12px] font-medium transition-colors hover:border-black/15"
            style={{ borderColor: BORDER, color: "rgba(8,8,8,0.78)", background: "rgba(244,240,232,0.45)" }}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: ACCENT }}>
        Preview
      </p>
    </div>
  );
}

export function PreviewRecentAssets({ lang }: PreviewNextActionsProps) {
  const assets = [
    { name: lang === "de" ? "Kampagnenvisual" : "Campaign visual", ratio: "4:5" },
    { name: lang === "de" ? "Reel Draft" : "Reel draft", ratio: "9:16" },
    { name: "Hook Set", ratio: "Text" },
  ];

  return (
    <div className="min-w-0" data-preview-stagger>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: META }}>
        {lang === "de" ? "Letzte Assets" : "Recent assets"}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {assets.map((asset) => (
          <div
            key={asset.name}
            className="flex min-w-0 items-center justify-between gap-2 rounded border px-3 py-2.5"
            style={{ borderColor: BORDER, background: "rgba(244,240,232,0.38)" }}
          >
            <span className="truncate text-[13px] font-medium text-[#080808]">{asset.name}</span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: META }}>
              {asset.ratio}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
