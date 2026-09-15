"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonClass } from "@/components/ui/button";

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
    <div className="mx-auto w-full max-w-3xl px-5 py-28 sm:px-8">
      <div className="flex flex-col gap-6">
        <p className="eyebrow text-accent">Error</p>
        <h1 className="display text-[2.25rem] sm:text-[3rem]">Something went wrong</h1>
        <p className="text-ink-soft max-w-[52ch] text-lg/[1.65]">
          This page failed to load. Trying again often resolves it.
        </p>
        {error.digest && (
          <p className="text-ink-muted font-mono text-xs">Reference: {error.digest}</p>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={reset} className={buttonClass("primary", "md")}>
            Try again
          </button>
          <Link href="/" className={buttonClass("secondary", "md")}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
