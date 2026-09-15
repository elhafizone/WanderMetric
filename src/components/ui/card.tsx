import Link from "next/link";

import { MediaImage } from "@/components/ui/media-image";
import type { MediaRef } from "@/core/content/types";

export interface CardProps {
  href: string;
  title: string;
  summary?: string | null;
  media: MediaRef | null;
  /** Most specific first — city slug, then country slug. */
  imageKeys?: Array<string | null | undefined>;
  eyebrow?: string | null;
  meta?: string | null;
  priority?: boolean;
  className?: string;
}

/**
 * The standard listing card.
 *
 * Type sits on paper, not on the photograph — the picture is a window, the
 * words below it are the editorial. That is the difference between a magazine
 * page and a booking result, and it is why this card survives a listing of
 * twelve without becoming visual noise.
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
  priority = false,
  className,
}: CardProps) {
  return (
    <article
      className={`group border-border bg-surface hover:border-border-strong ease-editorial relative flex h-full flex-col overflow-hidden rounded-xl border transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md ${className ?? ""}`}
    >
      <div className="bg-surface-2 relative aspect-[4/3] w-full overflow-hidden">
        <MediaImage
          media={media}
          label={title}
          imageKeys={imageKeys}
          priority={priority}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
          className="card-media"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-6">
        {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}

        <h3 className="display-sm text-xl">
          <Link href={href} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>

        {summary && (
          <p className="text-ink-muted line-clamp-3 text-[0.9375rem]/[1.6]">{summary}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {meta ? (
            <span className="text-ink-muted text-xs tracking-wide">{meta}</span>
          ) : (
            <span />
          )}
          <span aria-hidden="true" className="card-arrow text-accent text-sm">
            →
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * Full-bleed card: the photograph is the card, and the type sits on it.
 *
 * The caption sits on a warm ivory veil rather than in white on the image.
 * White-on-photo measured 1.76:1 over the Rome facade and 2.75:1 over
 * Barcelona, because those photographs are brightest exactly where a title
 * sits; the only rescue was an overlay dark enough to undo the point of using
 * bright photography. Charcoal on the veil measures far above AA, and the top
 * half of every frame stays completely clear.
 *
 * Reserved for the mosaic's featured slots and nothing else. It only works when
 * an item is genuinely being promoted above its neighbours — used everywhere it
 * would be a wall of overlaid text, which is the affiliate-site look this
 * design is avoiding.
 */
export function FeatureCard({
  href,
  title,
  summary,
  media,
  imageKeys,
  eyebrow,
  meta,
  priority = false,
  className,
  ratio = "aspect-[4/5] sm:aspect-[3/4]",
  sizes = "(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 46vw",
}: CardProps & { ratio?: string; sizes?: string }) {
  return (
    <article
      className={`group relative isolate overflow-hidden rounded-xl ${ratio} ${className ?? ""}`}
    >
      <MediaImage
        media={media}
        label={title}
        imageKeys={imageKeys}
        priority={priority}
        sizes={sizes}
        className="card-media"
      />

      <div className="veil absolute inset-x-0 bottom-0 flex flex-col gap-1.5 px-6 pt-20 pb-6 sm:px-7 sm:pb-7">
        {eyebrow && <p className="eyebrow text-ink-soft">{eyebrow}</p>}

        <h3 className="display text-ink text-[1.75rem] sm:text-[2.25rem]">
          <Link href={href} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>

        {summary && (
          <p className="text-ink-soft line-clamp-2 max-w-[46ch] text-sm/[1.6]">
            {summary}
          </p>
        )}

        <div className="mt-1 flex items-center gap-3">
          {meta && <span className="text-ink-muted text-xs">{meta}</span>}
          <span
            aria-hidden="true"
            className="card-arrow text-accent ml-auto text-lg opacity-0 group-hover:opacity-100"
          >
            →
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * Asymmetric editorial mosaic.
 *
 * Takes a list already ordered by importance and gives the first item roughly
 * twice the area of the next two. Degrades honestly: with one item it is a
 * single feature, with two it is a pair, and it never leaves a hole in the
 * grid — which is what usually goes wrong when a layout like this meets a
 * database that has fewer rows than the designer assumed.
 */
export function Mosaic({ children }: { children: React.ReactNode[] }) {
  const items = children.filter(Boolean);
  const [lead, ...rest] = items;

  if (items.length === 0) return null;
  if (items.length === 1) return <div className="grid gap-5">{lead}</div>;

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="lg:col-span-7">{lead}</div>
      <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
        {rest.slice(0, 2)}
      </div>
      {rest.length > 2 && (
        <div
          className={`grid gap-5 sm:grid-cols-2 lg:col-span-12 ${
            // Match the column count to what is left, so a trailing row of two
            // does not sit in a three-column grid with a visible hole in it.
            rest.length - 2 >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
          }`}
        >
          {rest.slice(2)}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-border bg-surface/60 rounded-xl border border-dashed px-8 py-16 text-center">
      <p className="display-sm text-xl">{title}</p>
      <p className="text-ink-muted mx-auto mt-2 max-w-prose text-sm/relaxed">
        {description}
      </p>
    </div>
  );
}
