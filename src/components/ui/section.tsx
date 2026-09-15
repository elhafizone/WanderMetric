import Link from "next/link";

/**
 * Section heading.
 *
 * The hairline above the eyebrow is what gives a scrolling page its cadence:
 * each section announces itself with a rule, a kicker and a display line,
 * rather than every block starting with the same bold sentence.
 */
/**
 * `tone` picks the eyebrow colour. Sage is the default; ember is the restrained
 * terracotta, and it is spent only where a section is about choosing or about
 * something time-bound — the comparison and the deals rail. Used on every
 * section it would stop meaning anything.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "See all",
  align = "split",
  tone = "accent",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "split" | "center";
  tone?: "accent" | "ember";
}) {
  const centered = align === "center";

  return (
    <div className={`flex flex-col gap-5 ${centered ? "items-center text-center" : ""}`}>
      <div aria-hidden="true" className={`rule w-full ${centered ? "max-w-24" : ""}`} />
      <div
        className={`flex flex-wrap items-end gap-x-8 gap-y-4 ${centered ? "flex-col items-center" : "justify-between"}`}
      >
        <div className="flex max-w-2xl flex-col gap-3">
          {eyebrow && (
            <p className={`eyebrow ${tone === "ember" ? "text-ember" : "text-accent"}`}>
              {eyebrow}
            </p>
          )}
          <h2 className="display text-[1.875rem] sm:text-[2.5rem]">{title}</h2>
          {description && (
            <p className="text-ink-muted max-w-prose text-base/[1.7]">{description}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="group/all text-ink hover:text-accent inline-flex shrink-0 items-center gap-2 text-sm font-medium transition-colors"
          >
            {linkLabel}
            <span
              aria-hidden="true"
              className="ease-editorial transition-transform duration-200 group-hover/all:translate-x-1"
            >
              →
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Page-level heading block for listings and detail pages that do not open with
 * a photographic hero.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4">
      {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}
      <h1 className="display max-w-[16ch] text-[2.25rem] sm:text-[3.5rem]">{title}</h1>
      {description && (
        <p className="text-ink-soft max-w-[58ch] text-lg/[1.65]">{description}</p>
      )}
      {children}
    </header>
  );
}
