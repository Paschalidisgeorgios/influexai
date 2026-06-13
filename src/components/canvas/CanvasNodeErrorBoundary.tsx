"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type CanvasNodeErrorBoundaryProps = {
  children: ReactNode;
  fallbackLabel?: string;
};

type CanvasNodeErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

/** Isolates render crashes inside a single canvas node — the flow keeps running. */
export class CanvasNodeErrorBoundary extends Component<
  CanvasNodeErrorBoundaryProps,
  CanvasNodeErrorBoundaryState
> {
  state: CanvasNodeErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): CanvasNodeErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Unbekannter Fehler",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== "production") {
      console.error("[CanvasNodeErrorBoundary]", error, info.componentStack);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, message: "" });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="w-[min(320px,88vw)] rounded-2xl border border-red-500/30 bg-zinc-950/80 p-4 backdrop-blur-xl"
          role="alert"
        >
          <div className="mb-2 flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <p className="text-xs font-semibold">
              {this.props.fallbackLabel ?? "Node"} — Anzeigefehler
            </p>
          </div>
          <p className="mb-3 text-[10px] leading-relaxed text-zinc-500">
            Diese Karte ist abgestürzt. Der Rest des Canvas funktioniert weiter.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-lg border border-zinc-700/80 px-3 py-1.5 text-[10px] font-medium text-zinc-300 transition-colors hover:border-[#ccff00]/30 hover:text-[#ccff00]"
          >
            Karte neu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
