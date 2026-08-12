import { Component, type ErrorInfo, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  className?: string;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Something went wrong.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  private reset = () => {
    this.setState({ hasError: false, message: "" });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className={cn(
          "mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 p-8 text-center",
          this.props.className,
        )}
      >
        <p className="text-lg font-bold text-[#e8edf8]">
          {this.props.title ?? "Something went wrong"}
        </p>
        <p className="text-sm text-[#7a8ba8]">{this.state.message}</p>
        <button
          type="button"
          onClick={this.reset}
          className="rounded-xl border-0 bg-gradient-to-br from-[#c44404] to-[#f7921e] px-4 py-2 text-[13px] font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }
}
