import type { CSSProperties } from "react";
import type {
  ThumbnailCssElement,
  ThumbnailCssLayout,
} from "@/app/actions/generate-thumbnail";

type Props = {
  layout: ThumbnailCssLayout;
  width?: number;
  height?: number;
};

const EDGE_PAD_PCT = 4;
const MAX_FONT_LARGE = 28;
const MAX_FONT_SMALL = 16;

function parsePercent(value: string, fallback: number): number {
  const v = value.trim();
  if (v.endsWith("%")) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  if (v.endsWith("px")) {
    return fallback;
  }
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampPercent(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function clampBox(el: ThumbnailCssElement): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  let left = parsePercent(el.x, 0);
  let top = parsePercent(el.y, 0);
  let width = parsePercent(el.width, 20);
  let height = parsePercent(el.height, 15);

  left = clampPercent(left, EDGE_PAD_PCT, 100 - EDGE_PAD_PCT - 5);
  top = clampPercent(top, EDGE_PAD_PCT, 100 - EDGE_PAD_PCT - 5);
  width = clampPercent(width, 8, 100 - left - EDGE_PAD_PCT);
  height = clampPercent(height, 8, 100 - top - EDGE_PAD_PCT);

  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

function cappedFontSize(el: ThumbnailCssElement): string {
  const raw = el.fontSize ?? "";
  const match = raw.match(/([\d.]+)/);
  const parsed = match ? parseFloat(match[1]) : null;
  const isLarge =
    (el.fontWeight && parseInt(el.fontWeight, 10) >= 700) ||
    (el.content?.length ?? 0) <= 18;
  const cap = isLarge ? MAX_FONT_LARGE : MAX_FONT_SMALL;
  if (parsed !== null && Number.isFinite(parsed)) {
    return `${Math.min(cap, Math.max(10, parsed))}px`;
  }
  return isLarge ? `${MAX_FONT_LARGE}px` : `${MAX_FONT_SMALL}px`;
}

function elementZIndex(type: ThumbnailCssElement["type"]): number {
  if (type === "shape") return 1;
  if (type === "face_placeholder") return 2;
  return 3;
}

export function ThumbnailPreview({ layout }: Props) {
  const sorted = [...layout.elements].sort(
    (a, b) => elementZIndex(a.type) - elementZIndex(b.type)
  );

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio: "16 / 9",
        width: "100%",
        maxWidth: 320,
        borderRadius: 8,
        border: "2px solid rgba(255,255,255,0.1)",
        background: layout.backgroundColor,
        flexShrink: 0,
        boxSizing: "border-box",
      }}
      aria-label="Thumbnail-Vorschau"
    >
      {sorted.map((el, i) => {
        const box = clampBox(el);
        const base: CSSProperties = {
          position: "absolute",
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          maxWidth: `calc(100% - ${EDGE_PAD_PCT * 2}%)`,
          maxHeight: `calc(100% - ${EDGE_PAD_PCT * 2}%)`,
          boxSizing: "border-box",
          zIndex: elementZIndex(el.type),
        };

        if (el.type === "text") {
          return (
            <div
              key={i}
              style={{
                ...base,
                color: el.color,
                fontSize: cappedFontSize(el),
                fontWeight: el.fontWeight ?? "800",
                lineHeight: 1.15,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                textAlign: "left",
                padding: "4px 6px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordBreak: "break-word",
                fontFamily: "Arial, Helvetica, sans-serif",
                textShadow:
                  "0 1px 2px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              {el.content}
            </div>
          );
        }

        if (el.type === "face_placeholder") {
          return (
            <div
              key={i}
              style={{
                ...base,
                borderRadius: 10,
                background: `linear-gradient(145deg, ${el.color}55, rgba(6,6,8,0.85))`,
                border: `2px solid ${el.color}99`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(1.25rem, 5vw, 2rem)",
                minWidth: 48,
                minHeight: 48,
              }}
              title={el.content || "Gesicht"}
            >
              <span aria-hidden>👤</span>
            </div>
          );
        }

        return (
          <div
            key={i}
            style={{
              ...base,
              background: el.color,
              borderRadius: 4,
              opacity: 0.75,
            }}
            title={el.content}
          />
        );
      })}
    </div>
  );
}
