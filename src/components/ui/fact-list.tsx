/**
 * The "at a glance" panel used by every detail page.
 *
 * Entries are filtered before rendering, so a page never shows a label with a
 * dash beside it. That matters more here than it looks: an empty row reads as
 * "this place has no airport" rather than "we do not store one", and the whole
 * site depends on never implying a fact it does not hold. If nothing survives
 * the filter, the panel does not render at all.
 */

export interface Fact {
  label: string;
  value: string | null | undefined;
  /** Codes and identifiers — IATA, ISO, currency. */
  mono?: boolean;
}

export function FactPanel({
  title = "At a glance",
  facts,
  className,
}: {
  title?: string;
  facts: Fact[];
  className?: string;
}) {
  const present = facts.filter((fact): fact is Fact & { value: string } =>
    Boolean(fact.value),
  );
  if (present.length === 0) return null;

  return (
    <div className={`border-border bg-surface rounded-xl border p-6 ${className ?? ""}`}>
      <h2 className="eyebrow text-ink-muted mb-4">{title}</h2>
      <dl className="divide-border flex flex-col divide-y text-sm">
        {present.map((fact) => (
          <div
            key={fact.label}
            className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <dt className="text-ink-muted shrink-0">{fact.label}</dt>
            <dd
              className={`text-right ${fact.mono ? "font-mono text-xs tracking-wider" : ""}`}
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
