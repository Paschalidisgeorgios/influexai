"use client";

import { BrainCircuit } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
} from "react";

const TOOL_LOADING_MESSAGES = [
  "Wird erstellt...",
  "KI arbeitet...",
  "Fast fertig...",
  "Wird erstellt...",
];

export type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  /** Chat/agent mode: "Erstellt" + dots. Tool mode: cycles status messages. */
  mode?: "agent" | "tool";
  loadingText?: string;
};

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    {
      isLoading = false,
      mode = "tool",
      loadingText,
      children,
      disabled,
      className = "",
      type = "button",
      style,
      ...props
    },
    ref
  ) {
    const [cycleIndex, setCycleIndex] = useState(0);

    useEffect(() => {
      if (!isLoading || mode !== "tool") return;
      const interval = setInterval(() => {
        setCycleIndex((i) => (i + 1) % TOOL_LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }, [isLoading, mode]);

    useEffect(() => {
      if (!isLoading) setCycleIndex(0);
    }, [isLoading]);

    const showLoading = Boolean(isLoading);

    const loadingLabel =
      loadingText ??
      (mode === "agent"
        ? "Erstellt"
        : TOOL_LOADING_MESSAGES[cycleIndex]);

    const mergedStyle = showLoading
      ? {
          ...style,
          background: "linear-gradient(90deg, #7AB800, #B4FF00, #7AB800)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s ease-in-out infinite",
          color: "#060608",
          fontWeight: 700,
        }
      : style;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || showLoading}
        className={`inline-flex items-center justify-center gap-2 font-semibold disabled:cursor-not-allowed ${className}`}
        style={mergedStyle}
        {...props}
      >
        {showLoading ? (
          <>
            <BrainCircuit
              className="h-4 w-4 shrink-0 animate-[spin_2s_linear_infinite]"
              aria-hidden
            />
            <span className="inline-flex items-center gap-0.5">
              {loadingLabel}
              {mode === "agent" && (
                <span className="inline-flex gap-0.5" aria-hidden>
                  <span className="loading-dot">.</span>
                  <span className="loading-dot loading-dot--2">.</span>
                  <span className="loading-dot loading-dot--3">.</span>
                </span>
              )}
            </span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
