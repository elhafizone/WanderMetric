import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { MediaImage } from "@/components/ui/media-image";
import { offerCardPhoto, type OfferCard as OfferCardData } from "@/core/offers/offers";
import { offerPath } from "@/core/sections/sections";
import { formatDuration } from "@/lib/format";

/**
 * An offer guide on a card: a photograph, where it is, the title, and who runs it.
 * Facts only. There is deliberately no price and no rating.
 *
 * Set straight on the page like every other card: the photograph has a soft
 * corner, the words sit beneath it with no frame, and a hairline separates the
 * facts. The photograph is looked up by the offer's own slug first, then its city
 * and country, so a card never shows a picture of somewhere else.
 */
export function OfferCard({
  offer,
  ratio = "aspect-[4/3]",
  lead = false,
}: {
  offer: OfferCardData;
  /** The photograph's aspect-ratio class; featured placements pass a taller one. */
  ratio?: string;
  /** The one large card in a composition: bigger title, a longer summary. */
  lead?: boolean;
}) {
  const where = offer.city ? `${offer.city.name}, ${offer.country.name}` : offer.country.name;
  const duration = formatDuration(offer.duration_minutes);
  const photo = offerCardPhoto(offer);

  return (
    <article className="group relative flex h-full flex-col gap-4">
      <div className={`bg-surface-2 relative w-full overflow-hidden rounded-lg ${ratio}`}>
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt || offer.name}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            unoptimized
            referrerPolicy="no-referrer"
            className="card-media object-cover"
          />
        ) : (
          <MediaImage
            media={null}
            label={offer.name}
            imageKeys={[offer.slug, offer.city?.slug, offer.country.slug]}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="card-media"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-secondary flex items-center gap-1.5 text-[0.8125rem]/[1.125rem] font-bold">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {where}
        </p>
        <h3
          className={`display-sm text-pretty ${
            lead ? "text-[2.125rem]/[1.06] sm:text-[2.75rem]/[1.04]" : "text-[1.625rem]/[1.12]"
          }`}
        >
          <Link
            href={offerPath(offer.section, offer.country.slug, offer.slug)}
            className="decoration-transparent group-hover:decoration-ink underline decoration-1 underline-offset-[5px] transition-colors after:absolute after:inset-0"
          >
            {offer.name}
          </Link>
        </h3>
        {offer.summary && (
          <p
            className={`text-ink-muted text-[0.9375rem]/[1.55] ${
              lead ? "max-w-[56ch] line-clamp-3 sm:text-base/[1.65]" : "line-clamp-2"
            }`}
          >
            {offer.summary}
          </p>
        )}
        <p className="border-border text-ink-muted mt-auto flex items-center gap-3 border-t pt-3 text-[0.8125rem]/[1.125rem] font-semibold">
          <span>{offer.program.name}</span>
          {duration && (
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {duration}
            </span>
          )}
          <ArrowUpRight aria-hidden="true" className="card-arrow text-ink ml-auto h-[1.125rem] w-[1.125rem]" />
        </p>
      </div>
    </article>
  );
}

/**
 * The compact form of an offer card: a small photograph beside the title, for a
 * run of guides that sits next to one large card. Same facts, same link.
 */
export function OfferRow({ offer }: { offer: OfferCardData }) {
  const where = offer.city ? `${offer.city.name}, ${offer.country.name}` : offer.country.name;
  const duration = formatDuration(offer.duration_minutes);
  const photo = offerCardPhoto(offer);

  return (
    <article className="group relative flex gap-4 py-5 first:pt-0 last:pb-0 sm:gap-5">
      <div className="bg-surface-2 relative h-28 w-28 shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-32">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt || offer.name}
            fill
            sizes="128px"
            unoptimized
            referrerPolicy="no-referrer"
            className="card-media object-cover"
          />
        ) : (
          <MediaImage
            media={null}
            label={offer.name}
            imageKeys={[offer.slug, offer.city?.slug, offer.country.slug]}
            sizes="128px"
            className="card-media"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-secondary flex items-center gap-1.5 text-[0.8125rem]/[1.125rem] font-bold">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {where}
        </p>
        <h3 className="display-sm text-[1.4375rem]/[1.12] text-pretty sm:text-[1.5625rem]">
          <Link
            href={offerPath(offer.section, offer.country.slug, offer.slug)}
            className="decoration-transparent group-hover:decoration-ink underline decoration-1 underline-offset-[5px] transition-colors after:absolute after:inset-0"
          >
            {offer.name}
          </Link>
        </h3>
        <p className="text-ink-muted mt-auto flex items-center gap-3 text-[0.8125rem]/[1.125rem] font-semibold">
          <span>{offer.program.name}</span>
          {duration && (
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {duration}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
