import { Clock, MapPin } from "lucide-react";
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
 * The photograph is looked up by the offer's own slug first, then its city and
 * country, so a card never shows a picture of somewhere else.
 */
export function OfferCard({ offer }: { offer: OfferCardData }) {
  const where = offer.city ? `${offer.city.name}, ${offer.country.name}` : offer.country.name;
  const duration = formatDuration(offer.duration_minutes);
  const photo = offerCardPhoto(offer);

  return (
    <article className="group border-border bg-surface hover:border-border-strong relative flex h-full flex-col overflow-hidden rounded-lg border transition-colors duration-150">
      <div className="bg-surface-2 relative aspect-[16/10] w-full overflow-hidden">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt || offer.name}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            unoptimized
            referrerPolicy="no-referrer"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <MediaImage
            media={null}
            label={offer.name}
            imageKeys={[offer.slug, offer.city?.slug, offer.country.slug]}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-secondary flex items-center gap-1.5 text-xs/4 font-extrabold tracking-[0.06em] uppercase">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {where}
        </p>
        <h3 className="display-sm text-[1.125rem]/6 text-pretty">
          <Link
            href={offerPath(offer.section, offer.country.slug, offer.slug)}
            className="after:absolute after:inset-0"
          >
            {offer.name}
          </Link>
        </h3>
        {offer.summary && (
          <p className="text-ink-soft line-clamp-3 text-sm/[1.55]">{offer.summary}</p>
        )}
        <p className="text-ink-muted mt-auto flex items-center gap-3 pt-2 text-[0.8125rem]/[1.125rem] font-semibold">
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
