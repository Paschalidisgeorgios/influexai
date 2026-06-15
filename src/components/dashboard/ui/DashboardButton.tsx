"use client";

/**
 * DashboardButton — button primitive.
 *
 * Props-compatible with a native <button> element, so it can be dropped in
 * wherever a button is used without refactoring surrounding code.
 *
 * Variant  → colour / border style
 * Size     → padding + type scale
 */

import { type ButtonHTMLAttributes } from "react";
import { buttons, focus } from "@/lib/design/dashboard-tokens";
import type { ButtonVariant, ButtonSize } from "@/lib/design/dashboard-tokens";

export interface DashboardButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function DashboardButton({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: DashboardButtonProps) {
  const variantClass = buttons.variants[variant];
  const sizeClass    = buttons.sizes[size];

  return (
    <button
      className={[
        "transition-colors",
        variantClass,
        sizeClass,
        focus.default,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
