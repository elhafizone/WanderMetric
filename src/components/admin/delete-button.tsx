"use client";

import { useState, useTransition } from "react";

import { deleteResource } from "@/lib/admin/actions";

/**
 * Two-step delete.
 *
 * A single click cannot remove a record: the button arms first and must be
 * confirmed. Deletion is a soft delete server-side, so this is recoverable —
 * but a published page disappearing from the site because of a stray click is
 * still worth one extra deliberate action.
 */
export function DeleteButton({ resource, id }: { resource: string; id: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-ink-muted hover:text-ink underline-offset-4 hover:underline"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="text-ink-muted">Are you sure?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void deleteResource(resource, id))}
        className="border-border hover:border-accent hover:text-accent rounded-md border px-2.5 py-1 text-xs disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-ink-muted underline-offset-4 hover:underline"
      >
        Cancel
      </button>
    </span>
  );
}
