import Image from "next/image";

import type { MediaRef } from "@/core/content/types";
import { publicMediaUrl } from "@/lib/media";

/**
 * Image with a deterministic fallback.
 *
 * Seeded content intentionally ships without photography — hotlinking or
 * inventing imagery would be worse than an honest placeholder. The fallback
 * derives its hue from the label, so each place keeps a stable identity rather
 * than every card rendering the same grey box.
 */
export function MediaImage({
  media,
  label,
  sizes,
  priority = false,
  className,
}: {
  media: MediaRef | null;
  label: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const url = publicMediaUrl(media);

  if (!url) {
    const hue = [...label].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    return (
      <div
        aria-hidden="true"
        className={`flex items-center justify-center ${className ?? ""}`}
        style={{
          background: `linear-gradient(135deg, oklch(0.72 0.09 ${hue}), oklch(0.55 0.11 ${(hue + 48) % 360}))`,
        }}
      >
        <span className="text-2xl font-semibold text-white/85">{label.charAt(0)}</span>
      </div>
    );
  }

  return (
    <Image
      src={url}
      alt={media?.alt_text ?? label}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className ?? ""}`}
    />
  );
}
