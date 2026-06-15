"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class DashboardNodeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[DashboardNode] Error:", error, info);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="flex h-full min-h-[80px] items-center justify-center rounded-lg border border-red-900/40 bg-red-950/20 p-4">
          <p className="text-center text-xs text-red-400">
            Fehler beim Laden. Bitte Seite neu laden.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
