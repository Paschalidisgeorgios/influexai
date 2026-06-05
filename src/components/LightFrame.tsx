import type { ReactNode } from "react";

type LightFrameProps = {
  children: ReactNode;
  className?: string;
};

/** Accent glow + inner vignette for landing media (reads var(--accent)). */
export function LightFrame({ children, className = "" }: LightFrameProps) {
  return (
    <div className={`ix-frame${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
