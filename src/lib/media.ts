import { editorialImage, type EditorialImage } from "@/core/media/imagery";
import type { MediaRef } from "@/core/content/types";

/**
 * Resolves a media row to a public Supabase Storage URL.
 *
 * Built from the project URL rather than stored per row, so moving buckets or
 * projects does not require rewriting every record.
 */
export function publicMediaUrl(media: MediaRef | null): string | null {
  if (!media) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${media.bucket}/${media.storage_path}`;
}

export interface ResolvedImage {
  src: string;
  alt: string;
  /** Present only for registry images; Storage rows may not know their size. */
  width: number | null;
  height: number | null;
  focus: string | null;
  credit: EditorialImage["credit"] | null;
}

/**
 * The single place the site decides which picture to show.
 *
 * Order is fixed and deliberate:
 *
 *   1. a `media` row — the editor uploaded something, so it wins outright;
 *   2. the editorial registry, matched on the most specific key supplied;
 *   3. nothing, and the caller draws its placeholder.
 *
 * Because every component goes through here, swapping the fallback source
 * later — Storage, a CMS, a provider's CDN — is a change to this function and
 * nothing else.
 */
export function resolveImage(
  media: MediaRef | null,
  keys: Array<string | null | undefined> = [],
): ResolvedImage | null {
  const url = publicMediaUrl(media);
  if (url && media) {
    return {
      src: url,
      alt: media.alt_text,
      width: media.width,
      height: media.height,
      focus: null,
      credit: null,
    };
  }

  const editorial = editorialImage(...keys);
  if (editorial) {
    return {
      src: editorial.src,
      alt: editorial.alt,
      width: editorial.width,
      height: editorial.height,
      focus: editorial.focus ?? null,
      credit: editorial.credit,
    };
  }

  return null;
}
