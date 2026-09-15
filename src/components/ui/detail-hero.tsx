import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { MediaImage } from "@/components/ui/media-image";
import { Container } from "@/components/layout/container";
import type { MediaRef } from "@/core/content/types";
import { resolveImage } from "@/lib/media";

/**
 * Opening block for a detail page.
 *
 * Two shapes, chosen by whether a photograph exists — not by a prop, so a page
 * cannot ask for the cinematic treatment and then render it over an empty
 * frame:
 *
 * - **With an image**: full-bleed, the title set over the photograph. The page
 *   runs under the fixed header, which is what makes it feel like a cover.
 * - **Without one**: a paper header with a hairline rule. Quieter, but it is a
 *   deliberate typographic opening rather than a gap where a picture failed.
 */
export function DetailHero({
  crumbs,
  eyebrow,
  title,
  description,
  media,
  imageKeys = [],
  meta,
}: {
  crumbs: Crumb[];
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  media: MediaRef | null;
  imageKeys?: Array<string | null | undefined>;
  /** Byline, date, reading time — rendered under the description. */
  meta?: React.ReactNode;
}) {
  const image = resolveImage(media, imageKeys);

  if (!image) {
    return (
      <Container width="wide">
        <div className="flex flex-col gap-6 pt-28 sm:pt-36">
          <Breadcrumbs items={crumbs} />
          <header className="flex flex-col gap-4">
            {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}
            <h1 className="display max-w-[18ch] text-[2.5rem] sm:text-[4rem]">{title}</h1>
            {description && (
              <p className="text-ink-soft max-w-[58ch] text-lg/[1.65]">{description}</p>
            )}
            {meta}
          </header>
          <div aria-hidden="true" className="rule mt-2 w-full" />
        </div>
      </Container>
    );
  }

  return (
    <section className="relative isolate flex min-h-[68svh] flex-col justify-end overflow-hidden sm:min-h-[74svh]">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <MediaImage
          media={media}
          label={title}
          imageKeys={imageKeys}
          priority
          sizes="100vw"
          className="intro-media"
        />
      </div>

      {/* The fade lives in this padding. It is shorter on a phone, where the
          text block already takes most of a 68svh hero and a tall fade would
          leave almost no clear photograph above it. */}
      <div className="veil w-full pt-20 sm:pt-36 lg:pt-44">
        <Container width="wide" className="pb-12 sm:pb-16">
          <div className="flex flex-col gap-5">
            <div className="intro intro-1">
              <Breadcrumbs items={crumbs} />
            </div>
            {eyebrow && <p className="intro intro-1 eyebrow text-ink-soft">{eyebrow}</p>}
            <h1 className="intro intro-2 display text-ink max-w-[16ch] text-[2.5rem] sm:text-[4rem] lg:text-[4.75rem]">
              {title}
            </h1>
            {description && (
              <p className="intro intro-3 text-ink-soft max-w-[56ch] text-lg/[1.6]">
                {description}
              </p>
            )}
            {meta && <div className="intro intro-3 text-ink-muted">{meta}</div>}
          </div>
        </Container>
      </div>

      {image.credit && (
        <p className="text-ink-muted/70 absolute right-4 bottom-2 text-[10px] tracking-wide sm:right-8">
          Photograph: {image.credit.photographer} / {image.credit.source}
        </p>
      )}
    </section>
  );
}
