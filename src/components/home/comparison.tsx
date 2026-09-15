import Link from "next/link";

import { MediaImage } from "@/components/ui/media-image";
import type { MediaRef } from "@/core/content/types";

/**
 * Destination comparison.
 *
 * Every row is a fact the database actually holds. There is no "budget level",
 * no "nightlife score" and no five-star atmosphere rating, because nothing in
 * the schema stores one and inventing a number to fill a column is exactly the
 * kind of thing this project refuses to do.
 *
 * Only labels present on *both* sides are rendered. A half-empty comparison
 * table is worse than a shorter one, and a dash in a cell reads as a judgement
 * about the place rather than a gap in our coverage.
 */

export interface ComparisonFact {
  label: string;
  value: string;
}

export interface ComparisonSide {
  title: string;
  href: string;
  eyebrow: string;
  excerpt: string | null;
  media: MediaRef | null;
  imageKeys: Array<string | null | undefined>;
  facts: ComparisonFact[];
}

export function Comparison({
  left,
  right,
}: {
  left: ComparisonSide;
  right: ComparisonSide;
}) {
  const shared = left.facts
    .map((fact) => fact.label)
    .filter((label) => right.facts.some((fact) => fact.label === label));

  const valueFor = (side: ComparisonSide, label: string) =>
    side.facts.find((fact) => fact.label === label)?.value ?? null;

  return (
    <div className="border-border bg-surface overflow-hidden rounded-xl border">
      <div className="grid sm:grid-cols-2">
        {[left, right].map((side, index) => (
          <div
            key={side.href}
            className={`group relative flex flex-col ${
              index === 0 ? "sm:border-border sm:border-r" : ""
            }`}
          >
            <div className="bg-surface-2 relative aspect-[16/10] overflow-hidden">
              <MediaImage
                media={side.media}
                label={side.title}
                imageKeys={side.imageKeys}
                sizes="(max-width: 640px) 92vw, 42vw"
                className="card-media"
              />
              <div className="veil absolute inset-x-0 bottom-0 flex flex-col gap-1 px-6 pt-20 pb-6">
                <p className="eyebrow text-ink-soft">{side.eyebrow}</p>
                <h3 className="display text-ink text-[2rem]">
                  <Link href={side.href} className="after:absolute after:inset-0">
                    {side.title}
                  </Link>
                </h3>
              </div>
            </div>

            {side.excerpt && (
              <p className="text-ink-muted border-border border-b px-6 py-5 text-[0.9375rem]/[1.6]">
                {side.excerpt}
              </p>
            )}
          </div>
        ))}
      </div>

      {shared.length > 0 && (
        <dl className="divide-border divide-y">
          {shared.map((label) => (
            <div key={label} className="grid grid-cols-2 sm:grid-cols-[1fr_auto_1fr]">
              <dd className="px-6 py-4 text-sm sm:text-right">{valueFor(left, label)}</dd>
              <dt className="text-ink-muted order-first col-span-2 px-6 pt-4 text-center text-[11px] font-medium tracking-[0.14em] uppercase sm:order-none sm:col-span-1 sm:self-center sm:px-8 sm:pt-0">
                {label}
              </dt>
              <dd className="px-6 py-4 text-sm">{valueFor(right, label)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
