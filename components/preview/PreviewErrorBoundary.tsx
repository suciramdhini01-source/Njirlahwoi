"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

interface Props {
  children: ReactNode;
  resetKey?: string | number;
}

interface State {
  error: Error | null;
  attempts: number;
}

export class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempts: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (typeof window !== "undefined") {
      console.warn("[preview-isolated]", error.message);
    }
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null, attempts: 0 });
    }
  }

  reset = () => this.setState((s) => ({ error: null, attempts: s.attempts + 1 }));

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="w-full h-full bg-[#0d0d15] flex flex-col items-center justify-center text-center p-6">
        <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <p className="text-[13px] font-semibold text-white mb-1">
          Preview crashed (builder tetap aman)
        </p>
        <p className="text-[11px] text-gray-400 max-w-sm mb-4 font-mono">
          {this.state.error.message?.slice(0, 200) || "Unknown runtime error"}
        </p>
        <button
          onClick={this.reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] bg-blue-600 hover:bg-blue-500 text-white transition"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Reload Preview
        </button>
      </div>
    );
  }
}
