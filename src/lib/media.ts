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
