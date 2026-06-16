"use client";

import { cn } from "./cn";
import { STUDIO_MUTED, STUDIO_TEXT } from "./tokens";

export function StudioSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4 md:space-y-5", className)}>
      {title || description ? (
        <div className="space-y-1">
          {title ? (
            <h2
              className="text-lg font-bold tracking-tight md:text-xl"
              style={{ color: STUDIO_TEXT, letterSpacing: "-0.02em" }}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed" style={{ color: STUDIO_MUTED }}>
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
