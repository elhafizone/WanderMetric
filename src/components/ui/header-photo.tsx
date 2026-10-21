import Image from "next/image";

/**
 * A photograph beside a page header: a country or a city, shown the way the
 * partner shows it on one of its own listings, and credited to that partner.
 *
 * Rendered only when an offer in the place really has a photograph, so a header
 * without one simply has no picture rather than a stand-in.
 */
export function HeaderPhoto({
  photo,
}: {
  photo: { url: string; alt: string; credit: string } | null | undefined;
}) {
  if (!photo) return null;

  return (
    <figure className="flex w-full flex-col gap-1.5 lg:w-[24rem] lg:shrink-0">
      <div className="bg-surface-2 relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          sizes="(max-width: 1024px) 92vw, 384px"
          unoptimized
          referrerPolicy="no-referrer"
          className="object-cover"
        />
      </div>
      <figcaption className="text-ink-muted text-[0.75rem]">Photo from {photo.credit}</figcaption>
    </figure>
  );
}
