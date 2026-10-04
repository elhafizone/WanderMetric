import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MediaImage } from "@/components/ui/media-image";
import type { MediaRef } from "@/core/content/types";

/** A single fact line on a card: an icon and a short piece of text. */
export interface CardFact {
  icon: React.ReactNode;
  text: string;
}

export interface CardProps {
  href: string;
  title: string;
  summary?: string | null;
  media: MediaRef | null;
  /** Most specific first — city slug, then country slug. */
  imageKeys?: Array<string | null | undefined>;
  eyebrow?: string | null;
  meta?: string | null;
  /** Short facts under the title, e.g. "Best Apr–Jun". Only real, stored ones. */
  facts?: CardFact[];
  priority?: boolean;
  className?: string;
}

/**
 * The standard listing card.
 *
 * A photograph on top, the words on paper beneath it: a small overline, a
 * display title, two lines of support and a quiet arrow. That is what lets a
 * grid of twelve stay scannable. Real photographs only — where there is none
 * the brand mark stands in, never a picture of somewhere else.
 *
 * The stretched pseudo-element keeps the whole card clickable while leaving
 * exactly one link in the accessibility tree.
 */
export function ContentCard({
  href,
  title,
  summary,
  media,
  imageKeys,
  eyebrow,
  meta,
  facts,
  priority = false,
  className,
}: CardProps) {
  return (
    <article
      className={`group border-border bg-surface ease-editorial relative flex h-full flex-col overflow-hidden rounded-lg border transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md ${className ?? ""}`}
    >
      <div className="bg-surface-2 relative aspect-[4/3] w-full overflow-hidden">
        <MediaImage
          media={media}
          label={title}
          imageKeys={imageKeys}
          priority={priority}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {eyebrow && (
          <p className="text-secondary text-xs/4 font-extrabold tracking-[0.06em] uppercase">
            {eyebrow}
          </p>
        )}

        <h3 className="display-sm text-[1.25rem]/[1.3]">
          <Link href={href} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>

        {summary && <p className="text-ink-muted line-clamp-2 text-sm/5">{summary}</p>}

        {facts && facts.length > 0 && (
          <ul className="text-ink-soft mt-auto flex flex-col gap-1.5 pt-1 text-[0.8125rem]/[1.125rem] font-semibold">
            {facts.map((fact) => (
              <li key={fact.text} className="flex items-center gap-1.5">
                {fact.icon}
                {fact.text}
              </li>
            ))}
          </ul>
        )}

        <div className="text-ink-muted mt-auto flex items-center justify-between gap-3 pt-2 text-[0.8125rem] font-semibold">
          {meta ? <span className="tabular-nums">{meta}</span> : <span />}
          <ArrowRight
            aria-hidden="true"
            className="text-accent h-[1.125rem] w-[1.125rem] transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </article>
  );
}

/**
 * Kept for the pages that still ask for a "feature" treatment. The identity has
 * one card shape, so this is the same card; the extra props are accepted and
 * ignored rather than breaking those call sites.
 */
export function FeatureCard(
  props: CardProps & { ratio?: string; sizes?: string },
) {
  const { ratio: _ratio, sizes: _sizes, ...card } = props;
  void _ratio;
  void _sizes;
  return <ContentCard {...card} />;
}

/**
 * A responsive grid for cards. Two columns from small screens, three from
 * large; it never leaves a hole because it is a plain grid, not a mosaic.
 */
export function Mosaic({ children }: { children: React.ReactNode[] }) {
  const items = children.filter(Boolean);
  if (items.length === 0) return null;

  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items}</div>;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-border-strong bg-surface rounded-lg border border-dashed px-6 py-12 text-center sm:px-8 sm:py-16">
      <p className="display-sm text-xl">{title}</p>
      <p className="text-ink-soft mx-auto mt-2 max-w-prose text-[0.9375rem]/[1.5rem]">
        {description}
      </p>
    </div>
  );
}
