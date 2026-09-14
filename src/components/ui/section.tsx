import Link from "next/link";

/** Section heading with an optional "see all" affordance. */
export function SectionHeader({
  title,
  description,
  href,
  linkLabel = "See all",
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h2>
        {description && <p className="text-ink-muted max-w-prose">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="text-accent text-sm font-medium underline-offset-4 hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/** Page-level heading block used by every listing and detail page. */
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
}) {
  return (
    <header className="flex flex-col gap-3">
      {eyebrow && (
        <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="text-ink-muted max-w-[65ch] text-lg/relaxed">{description}</p>
      )}
    </header>
  );
}
