import Link from "next/link";

/** Shared admin primitives. Plain, dense and legible — this is a tool, not a page. */

export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-ink-muted text-sm">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="bg-accent text-accent-contrast rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {action.label}
        </Link>
      )}
    </header>
  );
}

/** Status is encoded in colour as well as text so it reads at a glance. */
export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    published: "bg-accent/15 text-accent",
    active: "bg-accent/15 text-accent",
    draft: "bg-surface-2 text-ink-muted",
    review: "bg-surface-2 text-ink",
    archived: "bg-surface-2 text-ink-muted",
    paused: "bg-surface-2 text-ink-muted",
    disabled: "bg-surface-2 text-ink-muted",
    subscribed: "bg-accent/15 text-accent",
    pending: "bg-surface-2 text-ink-muted",
  };

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase ${tone[status] ?? "bg-surface-2 text-ink-muted"}`}
    >
      {status}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="border-border bg-surface flex flex-col gap-1 rounded-lg border p-4">
      <p className="text-ink-muted text-xs">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-ink-muted text-xs">{hint}</p>}
    </div>
  );
}

export function AdminEmpty({ message }: { message: string }) {
  return (
    <div className="border-border text-ink-muted rounded-lg border border-dashed p-10 text-center text-sm">
      {message}
    </div>
  );
}

export function AdminNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
        tone === "warning"
          ? "border-border bg-surface-2 text-ink"
          : "border-border bg-surface text-ink-muted"
      }`}
    >
      {children}
    </div>
  );
}
