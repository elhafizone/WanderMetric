import { MediaImage } from "@/components/ui/media-image";
import { Parallax } from "@/components/motion/parallax";
import type { MediaRef } from "@/core/content/types";
import { resolveImage } from "@/lib/media";

/**
 * The article's opening photograph.
 *
 * It is a wide cinematic band inset from the text column, not a full-bleed
 * cover with the title over it. The title is already set in charcoal on ivory
 * above this, which is the magazine convention and also the measurable one: the
 * site's earlier white-on-photograph headers came out at 1.13:1 and 1.76:1
 * contrast over the bright photography this palette was rebuilt around. Words
 * on paper, picture in a frame — and the photograph is then free to be as
 * bright as it likes.
 *
 * Motion is one scroll-linked drift and nothing else. `Parallax` composes the
 * frame correctly in plain CSS before GSAP arrives and keeps it correct if GSAP
 * never does — the library only adds movement, so the image can never be
 * missing or clipped because a chunk failed. This is the one parallax on the
 * page; applying it to every image would make a long read feel unstable.
 *
 * A caption renders only when the picture carries real attribution. The
 * editorial registry stores a photographer and a source per image; a Storage
 * row does not, so a database-hosted photograph draws its alt text and no
 * caption rather than a fabricated credit line.
 */
export function ArticleHero({
  media,
  label,
  imageKeys = [],
}: {
  media: MediaRef | null;
  /** Used for the placeholder and as a last-resort alt. */
  label: string;
  imageKeys?: Array<string | null | undefined>;
}) {
  const image = resolveImage(media, imageKeys);

  // No photograph, no frame. A 21:9 placeholder above an article is a large
  // empty rectangle that reads as a picture that failed to load, and the
  // registry deliberately holds no stand-in image for a place it has none of.
  // The article simply opens on type instead — eyebrow, headline, dek, rule —
  // which is a normal magazine opening rather than a hole. `DetailHero` makes
  // the same call for the same reason.
  if (!image) return null;

  return (
    <figure className="flex flex-col gap-3">
      <Parallax
        strength={6}
        className="bg-surface-2 relative aspect-[16/10] w-full rounded-xl shadow-md sm:aspect-[2/1] lg:aspect-[21/9]"
      >
        <MediaImage
          media={media}
          label={label}
          imageKeys={imageKeys}
          priority
          sizes="(max-width: 1024px) 100vw, 1344px"
        />
      </Parallax>

      {image?.credit && (
        <figcaption className="text-ink-muted flex flex-wrap gap-x-2 text-xs/[1.6]">
          <span>{image.alt}</span>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span className="opacity-80">
            {image.credit.photographer} / {image.credit.source}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
