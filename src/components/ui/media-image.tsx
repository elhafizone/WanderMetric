import Image from "next/image";

import { LogoMark } from "@/components/brand/logo";
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
}: {
  media: MediaRef | null;
  /** Used for the placeholder and as a last-resort alt. */
  label: string;
  sizes: string;
  imageKeys?: Array<string | null | undefined>;
  priority?: boolean;
  className?: string;
}) {
  const image = resolveImage(media, imageKeys);

  if (!image) return <MediaPlaceholder className={className} />;

  return (
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
  );
}

/**
 * Placeholder for content with no photograph yet: a sand ground with the mark
 * set faintly in the middle. It reads as a deliberate blank belonging to the
 * brand rather than an asset that failed to load, and it never claims to show
 * anything.
 */
export function MediaPlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface-2 flex items-center justify-center ${className ?? ""}`}
    >
      <LogoMark className="text-ink h-10 w-10 opacity-[0.16]" />
    </div>
  );
}
