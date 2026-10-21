import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/layout/container";
import { MediaImage } from "@/components/ui/media-image";
import type { MediaRef } from "@/core/content/types";
import { resolveImage } from "@/lib/media";

/**
 * Opening block for a detail page.
 *
 * Text on the left, a photograph on the right at 16:11, both on the plain page
 * ground: the identity's destination-hub opening. The shape is chosen by
 * whether a photograph exists, not by a prop, so a page cannot ask for the
 * image column and then render it over an empty frame — without one the text
 * simply takes the full width.
 *
 * `meta` (a byline, an updated badge, a reading time) sits under the
 * description; `actions` is a row of buttons under that.
 */
export function DetailHero({
  crumbs,
  eyebrow,
  title,
  description,
  media,
  imageKeys = [],
  meta,
  actions,
}: {
  crumbs: Crumb[];
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  media: MediaRef | null;
  imageKeys?: Array<string | null | undefined>;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const image = resolveImage(media, imageKeys);

  return (
    <Container className="pt-4 sm:pt-5">
      <Breadcrumbs items={crumbs} />
      <div
        className={`mt-5 grid items-center gap-8 sm:mt-6 ${
          image ? "lg:grid-cols-[minmax(0,1fr)_35rem] lg:gap-10" : ""
        }`}
      >
        <header className="flex flex-col gap-4">
          {eyebrow && (
            <p className="eyebrow text-secondary text-[0.9375rem]">{eyebrow}</p>
          )}
          <h1 className="display max-w-[22ch] text-[2.125rem]/[1.08] sm:text-[2.75rem]/[1.06] lg:text-[3.5rem]/[1.04]">
            {title}
          </h1>
          {description && (
            <p className="text-ink-soft max-w-[58ch] text-base/[1.625rem] sm:text-[1.125rem]/[1.75rem]">
              {description}
            </p>
          )}
          {meta && <div className="text-ink-muted flex flex-wrap items-center gap-3">{meta}</div>}
          {actions && <div className="flex flex-wrap gap-2.5 pt-1">{actions}</div>}
        </header>

        {image && (
          <figure className="flex flex-col gap-1.5">
            <div className="bg-surface-2 relative aspect-[16/11] w-full overflow-hidden rounded-2xl">
              <MediaImage
                media={media}
                label={title}
                imageKeys={imageKeys}
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </div>
            {image.credit && (
              <figcaption className="text-ink-muted text-[0.6875rem] tracking-wide">
                Photograph: {image.credit.photographer} / {image.credit.source}
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </Container>
  );
}
