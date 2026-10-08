"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { OfferPhoto } from "@/core/content/offer-facts";

/**
 * The photographs the partner's own listing shows for this offer.
 *
 * They are the partner's pictures, loaded from the partner's servers and never
 * copied, so every frame carries a visible credit that links back to the
 * listing. A picture that fails to load is dropped instead of leaving a broken
 * frame, and the grid re-flows around the ones that did load.
 *
 * Layout follows the count: one wide picture; two side by side; three or more
 * as one large frame beside a stack of smaller ones.
 */
export function OfferGallery({
  photos,
  credit,
  sourceUrl,
  title,
}: {
  photos: OfferPhoto[];
  credit: string;
  sourceUrl: string | null;
  title: string;
}) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const visible = photos.filter((photo) => !failed.has(photo.url));
  if (visible.length === 0) return null;

  const shown = visible.slice(0, 5);
  const [lead, ...rest] = shown;
  if (!lead) return null;

  const frame = (photo: OfferPhoto, index: number, sizes: string, priority = false) => (
    <div key={photo.url} className="bg-surface-2 relative h-full min-h-0 w-full overflow-hidden">
      <Image
        src={photo.url}
        alt={photo.alt || `${title}, photograph ${index + 1}`}
        fill
        sizes={sizes}
        unoptimized
        priority={priority}
        referrerPolicy="no-referrer"
        className="object-cover transition-transform duration-500 ease-out hover:scale-[1.03]"
        onError={() => setFailed((current) => new Set(current).add(photo.url))}
      />
    </div>
  );

  return (
    <figure className="flex flex-col gap-2">
      <div
        className={`relative grid h-[17rem] gap-1.5 overflow-hidden rounded-xl sm:h-[24rem] lg:h-[28rem] ${
          rest.length === 0 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-[2fr_1fr]"
        }`}
      >
        {frame(lead, 0, "(max-width: 640px) 100vw, 66vw", true)}
        {rest.length > 0 && (
          <div
            className={`hidden gap-1.5 sm:grid ${
              rest.length === 1 ? "grid-rows-1" : rest.length === 2 ? "grid-rows-2" : "grid-cols-2 grid-rows-2"
            }`}
          >
            {rest.slice(0, 4).map((photo, index) => frame(photo, index + 1, "33vw"))}
          </div>
        )}
        <span className="bg-ink/80 text-on-media pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
          <Camera aria-hidden className="size-3.5" />
          Photos from {credit}
        </span>
      </div>
      <figcaption className="text-ink-muted text-xs">
        Photographs belong to {credit} and are shown from its listing
        {sourceUrl ? (
          <>
            {" "}
            (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener nofollow sponsored"
              className="underline underline-offset-2"
            >
              see the original
            </a>
            )
          </>
        ) : null}
        .
      </figcaption>
    </figure>
  );
}
