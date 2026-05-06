"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  scope?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (typeof window !== "undefined") {
      console.error(`[${this.props.scope || "scope"}]`, error);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[240px] p-6 text-center">
        <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <h3 className="text-[14px] font-semibold text-white">
          {this.props.fallbackTitle || "Bagian ini crash"}
        </h3>
        <p className="text-[12px] text-gray-500 mt-1 max-w-md">
          {this.state.error.message || "Unknown error"}
        </p>
        <button
          onClick={this.reset}
          className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] transition"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Coba lagi
        </button>
      </div>
    );
  }
}
