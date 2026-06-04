import type { CSSProperties } from "react";
import type { ThumbnailCssLayout } from "@/app/actions/generate-thumbnail";

type Props = {
  layout: ThumbnailCssLayout;
  width?: number;
  height?: number;
};

export function ThumbnailPreview({ layout, width = 320, height = 180 }: Props) {
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.1)",
        background: layout.backgroundColor,
        flexShrink: 0,
      }}
      aria-label="Thumbnail-Vorschau"
    >
      {layout.elements.map((el, i) => {
        const base: CSSProperties = {
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          boxSizing: "border-box",
        };

        if (el.type === "text") {
          return (
            <div
              key={i}
              style={{
                ...base,
                color: el.color,
                fontSize: el.fontSize ?? "clamp(10px, 3vw, 18px)",
                fontWeight: el.fontWeight ?? "800",
                lineHeight: 1.1,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                textAlign: "left",
                padding: "2px 4px",
                overflow: "hidden",
                wordBreak: "break-word",
                fontFamily: "Arial, Helvetica, sans-serif",
                textShadow: "0 1px 3px rgba(0,0,0,0.6)",
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
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${el.color}88, ${el.color}22)`,
                border: `2px solid ${el.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "#F0EFE8",
                textAlign: "center",
              }}
            >
              {el.content || "Gesicht"}
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
              opacity: 0.85,
            }}
            title={el.content}
          />
        );
      })}
    </div>
  );
}
