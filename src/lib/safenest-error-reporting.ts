type SafeNestErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type SafeNestEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: SafeNestErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __safenestEvents?: SafeNestEvents;
    __safenestReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

export function reportSafeNestError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  
  // Custom console logging for SafeNest application boundaries
  console.error("[SafeNest Error Boundary]:", error, context);
  
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  window.__safenestReportRuntimeError?.({
    message,
    ...(stack !== undefined && { stack }),
    filename: window.location.pathname,
  });
}
