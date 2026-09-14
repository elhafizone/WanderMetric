"use client";

import { useState } from "react";

/**
 * Newsletter signup.
 *
 * One of the very few client components on the public site — it exists because
 * inline success and error feedback is materially better than a full page
 * reload for this interaction. The form still has a real `action`, so a
 * no-JavaScript submission degrades to a normal POST rather than doing nothing.
 */

type Status = "idle" | "submitting" | "success" | "error";

export function SubscribeForm({ source = "website" }: { source?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    if (typeof email !== "string") return;

    setStatus("submitting");

    try {
      const response = await fetch("/api/v1/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const body = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(body?.data?.message ?? "Thanks — please check your inbox to confirm.");
        form.reset();
      } else {
        setStatus("error");
        setMessage(body?.error?.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="text-ink text-sm">
        {message}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      action="/api/v1/subscribe"
      method="post"
      className="flex flex-col gap-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          disabled={status === "submitting"}
          className="border-border bg-surface placeholder:text-ink-muted focus-visible:border-accent focus-visible:ring-accent/30 min-w-0 flex-1 rounded-md border px-4 py-2.5 text-base outline-none focus-visible:ring-2 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-accent text-accent-contrast rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "submitting" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>

      {status === "error" && (
        <p role="alert" className="text-ink-muted text-sm">
          {message}
        </p>
      )}

      <p className="text-ink-muted text-xs">
        Occasional travel guides and deals. Unsubscribe any time — we never share your
        address.
      </p>
    </form>
  );
}
