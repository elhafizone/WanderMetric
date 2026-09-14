"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary.
 *
 * The user sees a generic message and a way forward; the underlying error is
 * logged to the console for the server-side collector. `error.digest` is Next's
 * server-generated identifier, which is safe to surface and lets a report be
 * matched to a log line without exposing a stack trace.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        context: "app.error-boundary",
        message: error.message,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-20">
      <div className="flex flex-col gap-4">
        <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">Error</p>
        <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-ink-muted max-w-prose">
          This page failed to load. Trying again often resolves it.
        </p>
        {error.digest && (
          <p className="text-ink-muted font-mono text-xs">Reference: {error.digest}</p>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="bg-accent text-accent-contrast rounded-md px-5 py-2.5 text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-border hover:border-accent hover:text-accent rounded-md border px-5 py-2.5 text-sm font-medium"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
