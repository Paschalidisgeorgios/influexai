"use client";

import { cn } from "./cn";
import {
  STUDIO_INPUT_BG,
  STUDIO_MUTED,
  STUDIO_RADIUS,
  STUDIO_TEXT,
} from "./tokens";

const fieldBase = cn(
  STUDIO_RADIUS.input,
  "w-full border border-black/[0.08] px-4 text-[15px] leading-relaxed outline-none transition-[border-color,box-shadow]",
  "placeholder:text-black/30",
  "focus:border-[#B4FF00]/35 focus:shadow-[0_0_0_4px_rgba(180,255,0,0.07)]"
);

const fieldStyle = {
  background: STUDIO_INPUT_BG,
  color: STUDIO_TEXT,
} as const;

export function StudioFieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn("mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]", className)}
      style={{ color: STUDIO_MUTED }}
    >
      {children}
    </p>
  );
}

export function StudioInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(fieldBase, "py-3.5", className)}
      style={fieldStyle}
      {...props}
    />
  );
}

export function StudioTextarea({
  className,
  rows = 5,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(fieldBase, "min-h-[140px] resize-none py-3.5", className)}
      style={fieldStyle}
      {...props}
    />
  );
}

export function StudioSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        fieldBase,
        "cursor-pointer appearance-none bg-no-repeat py-3.5 pr-10",
        className
      )}
      style={{
        ...fieldStyle,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23080808' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundPosition: "right 14px center",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function StudioFieldHelper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs leading-relaxed", className)} style={{ color: STUDIO_MUTED }}>
      {children}
    </p>
  );
}
