import { ArrowUpRight } from "lucide-react";
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
 * A photograph with a soft corner, and the words set straight on the page
 * beneath it — no frame, no fill, no shadow. The photograph is the shape you
 * notice; a hairline above the meta line is the only structure. That is what
 * lets a grid of twelve stay scannable. Real photographs only — where there is
 * none the brand mark stands in, never a picture of somewhere else.
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
    <article className={`group relative flex h-full flex-col gap-4 ${className ?? ""}`}>
      <div className="bg-surface-2 relative aspect-[4/3] w-full overflow-hidden rounded-lg">
        <MediaImage
          media={media}
          label={title}
          imageKeys={imageKeys}
          priority={priority}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
          className="card-media"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {eyebrow && <p className="text-secondary text-[0.8125rem]/[1.125rem] font-bold">{eyebrow}</p>}

        <h3 className="display-sm text-[1.3125rem]/[1.25]">
          <Link
            href={href}
            className="decoration-transparent group-hover:decoration-ink underline decoration-1 underline-offset-[5px] transition-colors after:absolute after:inset-0"
          >
            {title}
          </Link>
        </h3>

        {summary && <p className="text-ink-muted line-clamp-2 text-[0.9375rem]/[1.55]">{summary}</p>}

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

        <div className="border-border text-ink-muted mt-auto flex items-center justify-between gap-3 border-t pt-3 text-[0.8125rem] font-semibold">
          {meta ? <span className="tabular-nums">{meta}</span> : <span />}
          <ArrowUpRight
            aria-hidden="true"
            className="card-arrow text-ink h-[1.125rem] w-[1.125rem]"
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

  return <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{items}</div>;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-border-strong bg-bg-tint rounded-xl border border-dashed px-6 py-14 text-center sm:px-8 sm:py-20">
      <p className="display-sm text-[1.375rem]">{title}</p>
      <p className="text-ink-soft mx-auto mt-3 max-w-prose text-[0.9375rem]/[1.6]">
        {description}
      </p>
    </div>
  );
}
