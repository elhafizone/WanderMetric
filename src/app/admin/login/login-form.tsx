"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Sign-in form.
 *
 * Authentication runs through Supabase Auth in the browser so the session
 * cookie is established by the SDK; middleware then keeps it refreshed.
 *
 * The error message is deliberately generic. Distinguishing "no such account"
 * from "wrong password" turns the form into an account-enumeration oracle.
 */
export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Those details did not work. Check them and try again.");
        setPending(false);
        return;
      }

      // Only same-origin paths are accepted, so a crafted ?next= cannot bounce
      // a freshly authenticated admin to an external site.
      const safeNext =
        nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/admin";

      router.replace(safeNext);
      router.refresh();
    } catch {
      setError("Could not reach the authentication service. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="border-border bg-surface focus-visible:border-accent focus-visible:ring-accent/30 rounded-md border px-3 py-2.5 text-base outline-none focus-visible:ring-2"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="border-border bg-surface focus-visible:border-accent focus-visible:ring-accent/30 rounded-md border px-3 py-2.5 text-base outline-none focus-visible:ring-2"
        />
      </div>

      {error && (
        <p role="alert" className="text-ink-muted text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-accent-contrast rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
