"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "./cn";
import {
  STUDIO_INPUT_BG,
  STUDIO_MUTED,
  STUDIO_RADIUS,
  STUDIO_TEXT,
} from "./tokens";

const fieldBase = cn(
  STUDIO_RADIUS.input,
  "w-full min-w-0 max-w-full border border-black/[0.08] px-4 text-[15px] leading-relaxed outline-none transition-[border-color,box-shadow]",
  "placeholder:text-black/30",
  "focus:border-[#B4FF00]/35 focus:shadow-[0_0_0_4px_rgba(180,255,0,0.07)]"
);

const fieldStyle = {
  backgroundColor: STUDIO_INPUT_BG,
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
      className={cn("mb-2.5 text-sm font-medium", className)}
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
    <div className="relative w-full min-w-0 max-w-full">
      <select
        className={cn(
          fieldBase,
          "cursor-pointer appearance-none py-3.5 pr-10",
          className
        )}
        style={fieldStyle}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={2}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
        style={{ color: STUDIO_MUTED }}
        aria-hidden
      />
    </div>
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
