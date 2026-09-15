import Link from "next/link";

/**
 * "Good to know" — the article's own metadata, set as an editorial panel.
 *
 * Every row here comes from a column on the guide row: its city, its country,
 * its category, its stored reading estimate, its publication date. There is no
 * budget, no "best time", no duration and no travel style, because `guides` has
 * nowhere to store them — a panel that invented those would be exactly the
 * fabrication CLAUDE.md rule 2 exists to prevent, and it would be invisible as
 * a lie because it would look like every other travel site.
 *
 * Rows with no value are dropped before rendering and the panel removes itself
 * entirely when nothing survives, so a guide with no city never shows a label
 * beside a dash. The same discipline as `FactPanel`, in the sand treatment the
 * article sidebar wants.
 */

export interface ArticleFact {
  label: string;
  value: string | null | undefined;
  href?: string;
}

export function ArticleFacts({
  title = "Good to know",
  facts,
  className,
}: {
  title?: string;
  facts: ArticleFact[];
  className?: string;
}) {
  const present = facts.filter((fact): fact is ArticleFact & { value: string } =>
    Boolean(fact.value),
  );
  if (present.length === 0) return null;

  return (
    <section
      aria-labelledby="article-facts"
      className={`border-border bg-bg-tint rounded-lg border p-5 shadow-sm ${className ?? ""}`}
    >
      <h2 id="article-facts" className="eyebrow text-ink-muted mb-4">
        {title}
      </h2>
      <dl className="divide-border flex flex-col divide-y text-sm">
        {present.map((fact) => (
          <div
            key={fact.label}
            className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0"
          >
            <dt className="text-ink-muted text-[0.6875rem] tracking-[0.14em] uppercase">
              {fact.label}
            </dt>
            <dd className="text-ink text-[0.9375rem]">
              {fact.href ? (
                <Link
                  href={fact.href}
                  className="hover:text-accent underline-offset-4 transition-colors hover:underline"
                >
                  {fact.value}
                </Link>
              ) : (
                fact.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
