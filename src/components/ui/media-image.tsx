import Image from "next/image";

import type { MediaRef } from "@/core/content/types";
import { resolveImage } from "@/lib/media";

/**
 * Every photograph on the site renders through this component.
 *
 * It asks `resolveImage` for a picture — database row first, editorial registry
 * second — and draws a placeholder only when there genuinely is none. Callers
 * pass `imageKeys` most-specific-first (city, then country), so a Lisbon card
 * shows Lisbon and never a stand-in for somewhere else.
 *
 * `fill` is used throughout, which is why every call site wraps this in a box
 * with a fixed aspect ratio: the space is reserved before the bytes arrive, so
 * nothing on the page shifts.
 */
export function MediaImage({
  media,
  label,
  sizes,
  imageKeys = [],
  priority = false,
  className,
  overlayClassName,
}: {
  media: MediaRef | null;
  /** Used for the placeholder and as a last-resort alt. */
  label: string;
  sizes: string;
  imageKeys?: Array<string | null | undefined>;
  priority?: boolean;
  className?: string;
  /** Scrim or tint drawn over the photograph. */
  overlayClassName?: string;
}) {
  const image = resolveImage(media, imageKeys);

  if (!image) return <MediaPlaceholder label={label} className={className} />;

  return (
    <>
      <Image
        src={image.src}
        alt={image.alt || label}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        style={image.focus ? { objectPosition: image.focus } : undefined}
        className={`object-cover ${className ?? ""}`}
      />
      {overlayClassName && (
        <div aria-hidden="true" className={`absolute inset-0 ${overlayClassName}`} />
      )}
    </>
  );
}

/**
 * Placeholder for content with no photograph yet.
 *
 * The previous version drew a hue-rotated gradient with a large initial, which
 * read as a broken image repeated across a listing. This is quieter: paper
 * tone, a hairline compass rule, and the initial set small in the display face.
 * It looks like a deliberate blank in a magazine rather than an asset that
 * failed to load — and it still varies per subject, so a grid of them does not
 * look like one repeated tile.
 */
export function MediaPlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const seed = [...label].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = 100 + (seed % 60);

  return (
    <div
      aria-hidden="true"
      className={`bg-surface-2 flex items-center justify-center ${className ?? ""}`}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, var(--wm-surface-2) 0%, var(--wm-surface-3) 55%, var(--wm-surface-2) 100%)`,
      }}
    >
      <span className="flex flex-col items-center gap-2">
        <span className="bg-border-strong h-px w-8" />
        <span className="font-display text-ink-muted/70 text-xl leading-none">
          {label.charAt(0).toUpperCase()}
        </span>
        <span className="bg-border-strong h-px w-8" />
      </span>
    </div>
  );
}
