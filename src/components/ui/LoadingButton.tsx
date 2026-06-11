"use client";

import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

export type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
  loadingSubtext?: string;
};

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    {
      isLoading = false,
      loadingText,
      loadingSubtext,
      children,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) {
    const showLoading = Boolean(isLoading);
    const label =
      showLoading && loadingText !== undefined ? loadingText : children;

    const button = (
      <button
        ref={ref}
        type={type}
        disabled={disabled || showLoading}
        className={`inline-flex items-center justify-center gap-2 ${
          showLoading ? "opacity-70" : ""
        } disabled:opacity-70 ${className}`}
        {...props}
      >
        {showLoading && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        )}
        {label}
      </button>
    );

    if (showLoading && loadingSubtext) {
      return (
        <div className="flex flex-col gap-1">
          {button}
          <p className="text-xs text-[rgba(255,255,255,0.45)]">{loadingSubtext}</p>
        </div>
      );
    }

    return button;
  }
);
