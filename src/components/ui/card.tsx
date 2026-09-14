import Link from "next/link";

import { MediaImage } from "@/components/ui/media-image";
import type { MediaRef } from "@/core/content/types";

/**
 * The single card used across every listing.
 *
 * One component rather than per-entity variants, so a destination, guide, hotel
 * and deal share identical edges, baselines and inner padding wherever they
 * appear side by side.
 */
export function ContentCard({
  href,
  title,
  summary,
  media,
  eyebrow,
  meta,
  priority = false,
}: {
  href: string;
  title: string;
  summary?: string | null;
  media: MediaRef | null;
  eyebrow?: string | null;
  meta?: string | null;
  priority?: boolean;
}) {
  return (
    <article className="group border-border bg-surface hover:border-accent/60 flex h-full flex-col overflow-hidden rounded-xl border transition-colors">
      <div className="bg-surface-2 relative aspect-[16/10] w-full max-w-full overflow-hidden">
        <MediaImage
          media={media}
          label={title}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {eyebrow && (
          <p className="text-accent font-mono text-[11px] tracking-[0.12em] uppercase">
            {eyebrow}
          </p>
        )}
        <h3 className="text-lg/snug font-semibold text-balance">
          {/* Stretched link: the whole card is the target, but only one link
              exists in the accessibility tree. */}
          <Link
            href={href}
            className="after:absolute after:inset-0 focus-visible:underline"
          >
            {title}
          </Link>
        </h3>
        {summary && (
          <p className="text-ink-muted line-clamp-3 text-sm/relaxed">{summary}</p>
        )}
        {meta && <p className="text-ink-muted mt-auto pt-2 text-xs">{meta}</p>}
      </div>
    </article>
  );
}

/** Consistent responsive grid for card listings. */
export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-border bg-surface rounded-xl border border-dashed p-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-ink-muted mx-auto mt-1 max-w-prose text-sm">{description}</p>
    </div>
  );
}
