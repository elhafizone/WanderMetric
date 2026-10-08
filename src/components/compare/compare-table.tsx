"use client";

import {
  CalendarCheck,
  Check,
  ExternalLink,
  Globe2,
  Headphones,
  LayoutList,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { CriterionIcon } from "@/core/affiliate/compare";

export interface CompareViewRow {
  linkSlug: string;
  name: string;
  kind: string;
  href: string;
  logo: string | null;
  values: Record<string, string | null>;
  sourceUrl: string;
}

export interface CompareViewCriterion {
  key: string;
  label: string;
  icon: CriterionIcon;
}

const ICONS: Record<CriterionIcon, LucideIcon> = {
  type: LayoutList,
  globe: Globe2,
  cancel: CalendarCheck,
  support: Headphones,
  star: Sparkles,
};

const NOT_STATED = "Not stated";

/** A tint per provider, so a list of six does not read as six copies of one tile. */
const TINTS = [
  "bg-accent text-accent-contrast",
  "bg-ember text-on-media",
  "bg-secondary text-on-media",
  "bg-success text-on-media",
  "bg-info text-on-media",
  "bg-ink text-on-media",
] as const;

/** Quick facts lifted from what the provider stated, shown as chips under its name. */
function quickFacts(values: Record<string, string | null>): string[] {
  const facts: string[] = [];
  if (values.cancellation && /free/i.test(values.cancellation)) facts.push("Free cancellation");
  if (values.support && /24\/7/.test(values.support)) facts.push("24/7 support");
  return facts;
}

/**
 * A comparison of providers within one category.
 *
 * Each provider is a card. On wide screens the cards share one column grid
 * under a single header row, so the same question sits in the same place on
 * every card and the eye can run down a column. On narrow screens the header
 * disappears and each card labels its own rows.
 *
 * Tick two or three providers and "Show only selected" narrows the list. A
 * criterion the provider did not state reads "Not stated"; nothing is invented.
 * The button is the only affiliate link per card and goes to /go/{slug}.
 */
export function CompareTable({
  criteria,
  rows,
  readOn,
}: {
  criteria: CompareViewCriterion[];
  rows: CompareViewRow[];
  readOn: string | null;
}) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [onlyPicked, setOnlyPicked] = useState(false);

  const toggle = (slug: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < 3) next.add(slug);
      return next;
    });

  const shown = onlyPicked && picked.size > 0 ? rows.filter((r) => picked.has(r.linkSlug)) : rows;
  const cap = picked.size >= 3;

  // The last criterion is the free-form "also states"; the rest are the aligned columns.
  const columns = criteria.slice(0, -1);
  const extra = criteria[criteria.length - 1];
  const value = (text: string | null) =>
    text ? (
      <span className="text-[0.9375rem]/[1.5]">{text}</span>
    ) : (
      <span className="text-ink-muted inline-flex items-center gap-1.5 text-[0.9375rem]">
        <X aria-hidden className="size-3.5" />
        {NOT_STATED}
      </span>
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft text-sm">
          {picked.size === 0
            ? "Use the tick on a card to pick up to three providers and compare only those."
            : `${picked.size} selected${cap ? " (the maximum)" : ""}.`}
        </p>
        {picked.size > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOnlyPicked((v) => !v)}
              aria-pressed={onlyPicked}
              className={`min-h-9 rounded-full border px-4 text-sm font-bold transition-colors ${
                onlyPicked ? "border-ink bg-ink text-on-media" : "border-border-strong hover:border-ink"
              }`}
            >
              Show only selected
            </button>
            <button
              type="button"
              onClick={() => {
                setPicked(new Set());
                setOnlyPicked(false);
              }}
              className="text-ink-soft hover:text-ink min-h-9 rounded-full px-3 text-sm font-semibold underline underline-offset-2"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((row, index) => {
          const on = picked.has(row.linkSlug);
          const facts = quickFacts(row.values);
          const extraValue = extra ? row.values[extra.key] : null;
          const ExtraIcon = extra ? ICONS[extra.icon] : Sparkles;
          return (
            <li key={row.linkSlug}>
              <article
                className={`bg-surface flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  on ? "border-ink ring-ink ring-1" : "border-border hover:border-border-strong"
                }`}
              >
                <header className="bg-bg-tint flex items-start justify-between gap-3 px-5 pt-5 pb-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    {row.logo ? (
                      <span className="border-border bg-surface relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border p-2 shadow-sm">
                        <Image
                          src={row.logo}
                          alt=""
                          width={40}
                          height={40}
                          unoptimized
                          className="size-10 object-contain"
                        />
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className={`font-display grid size-14 shrink-0 place-items-center rounded-2xl text-2xl font-bold shadow-sm ${TINTS[index % TINTS.length]}`}
                      >
                        {row.name.charAt(0)}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-col gap-1">
                      <h3 className="text-[1.125rem]/[1.4rem] font-bold">{row.name}</h3>
                      <span className="text-ink-muted text-xs font-semibold">{row.kind}</span>
                    </div>
                  </div>
                  <label
                    className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                      on
                        ? "border-ink bg-ink text-on-media"
                        : "border-border-strong bg-surface text-ink-soft hover:border-ink hover:text-ink"
                    } ${!on && cap ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!on && cap}
                      onChange={() => toggle(row.linkSlug)}
                      className="sr-only"
                    />
                    <Check aria-hidden className="size-4" strokeWidth={on ? 3 : 2} />
                    <span className="sr-only">
                      {on ? "Remove" : "Add"} {row.name} {on ? "from" : "to"} the comparison
                    </span>
                  </label>
                </header>

                {facts.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 px-5 pt-4">
                    {facts.map((fact) => (
                      <li
                        key={fact}
                        className="bg-success-soft text-success inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                      >
                        <Check aria-hidden className="size-3" strokeWidth={3} />
                        {fact}
                      </li>
                    ))}
                  </ul>
                )}

                <dl className="flex flex-1 flex-col gap-4 px-5 py-5">
                  {columns.map((criterion) => {
                    const Icon = ICONS[criterion.icon];
                    return (
                      <div key={criterion.key} className="flex items-start gap-3">
                        <span className="bg-accent-soft text-accent grid size-9 shrink-0 place-items-center rounded-lg">
                          <Icon aria-hidden className="size-[1.125rem]" />
                        </span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <dt className="text-ink-muted text-xs font-semibold">{criterion.label}</dt>
                          <dd>{value(row.values[criterion.key] ?? null)}</dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>

                {extra && (
                  <div className="bg-surface-2 border-border flex items-start gap-2.5 border-t px-5 py-3.5 text-[0.875rem]/[1.5]">
                    <ExtraIcon aria-hidden className="text-accent mt-0.5 size-4 shrink-0" />
                    <p>
                      <span className="text-ink-muted font-semibold">{extra.label}: </span>
                      {extraValue ?? <span className="text-ink-muted">{NOT_STATED}</span>}
                    </p>
                  </div>
                )}

                <div className="p-5 pt-4">
                  <a
                    href={row.href}
                    rel="sponsored nofollow noopener"
                    target="_blank"
                    className="bg-cta text-on-cta hover:bg-cta-hover flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-[0.9375rem] font-extrabold whitespace-nowrap transition-colors"
                  >
                    Visit {row.name}
                    <ExternalLink aria-hidden className="size-4" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <p className="text-ink-muted text-sm/[1.55]">
        Each line restates what the provider says on its own site{readOn ? `, read on ${readOn}` : ""}.
        &ldquo;Not stated&rdquo; means we did not find it there. We hold no prices or ratings of our own,
        and terms change, so confirm on the provider&rsquo;s page before you book.
      </p>
    </div>
  );
}
