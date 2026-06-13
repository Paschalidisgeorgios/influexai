"use client";

import type { CSSProperties, ReactNode } from "react";
import "@/styles/studio-glass.css";

type StudioGlassShellProps = {
  children: ReactNode;
  className?: string;
  /** Skip animated glow orbs (nested pages / performance) */
  minimal?: boolean;
  style?: CSSProperties;
};

export function StudioGlassShell({
  children,
  className = "",
  minimal = false,
  style,
}: StudioGlassShellProps) {
  return (
    <div
      className={`studio-glass-root studio-glass-dot-grid min-h-screen ${className}`}
      style={style}
    >
      {!minimal ? (
        <>
          <div className="studio-glass-glow studio-glass-glow--violet" aria-hidden />
          <div className="studio-glass-glow studio-glass-glow--green" aria-hidden />
        </>
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
