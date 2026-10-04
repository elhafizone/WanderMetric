import { Clock, MapPin } from "lucide-react";
import Link from "next/link";

import type { OfferCard as OfferCardData } from "@/core/offers/offers";
import { offerPath } from "@/core/sections/sections";
import { formatDuration } from "@/lib/format";

/**
 * An offer guide on a card. Facts only: where it is, who runs it, how long it
 * takes when the listing says so. There is deliberately no price and no rating.
 */
export function OfferCard({ offer }: { offer: OfferCardData }) {
  const where = offer.city ? `${offer.city.name}, ${offer.country.name}` : offer.country.name;
  const duration = formatDuration(offer.duration_minutes);

  return (
    <article className="group border-border bg-surface hover:border-border-strong relative flex h-full flex-col gap-2 rounded-lg border p-4 transition-colors duration-150">
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
      {offer.summary && <p className="text-ink-soft line-clamp-3 text-sm/[1.55]">{offer.summary}</p>}
      <p className="text-ink-muted mt-auto flex items-center gap-3 pt-2 text-[0.8125rem]/[1.125rem] font-semibold">
        <span>{offer.program.name}</span>
        {duration && (
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {duration}
          </span>
        )}
      </p>
    </article>
  );
}
