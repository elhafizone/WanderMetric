import { ArrowRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { MediaImage } from "@/components/ui/media-image";
import type { OfferCard } from "@/core/offers/offers";
import { getSection, offerPath } from "@/core/sections/sections";
import { formatDuration } from "@/lib/format";

/**
 * The home page opening: one featured guide, large, with three more beside it.
 *
 * There is no search box. The page opens on the work itself, and every card is a
 * real guide. Photographs come from the editorial registry by city then country;
 * where there is none the card shows the brand placeholder rather than a picture
 * of somewhere else.
 */

function where(offer: OfferCard) {
  return offer.city ? `${offer.city.name}, ${offer.country.name}` : offer.country.name;
}

function href(offer: OfferCard) {
  return offerPath(offer.section, offer.country.slug, offer.slug);
}

export function FeaturedHero({ offers }: { offers: OfferCard[] }) {
  const [lead, ...rest] = offers;
  if (!lead) return null;
  const side = rest.slice(0, 3);
  const leadSection = getSection(lead.section);
  const leadDuration = formatDuration(lead.duration_minutes);

  return (
    <section className="bg-bg-tint border-border border-b">
      <Container className="flex flex-col gap-6 pt-6 pb-8 sm:gap-8 sm:pt-10 sm:pb-12 lg:pt-12 lg:pb-14">
        <div className="flex max-w-[51rem] flex-col gap-3">
          <h1 className="display text-[2rem]/[2.25rem] tracking-[-0.03em] sm:text-[2.75rem]/[3rem] lg:text-[3.5rem]/[3.75rem]">
            Guides written from the real listing.
          </h1>
          <p className="text-ink-soft text-base/6 font-medium sm:text-[1.125rem]/7">
            What each tour, ticket and service includes, set out plainly, with the partner link
            when you are ready to book. No invented prices.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
          <article className="group border-border bg-surface relative flex flex-col overflow-hidden rounded-lg border">
            <div className="bg-surface-2 relative aspect-[16/9] w-full overflow-hidden">
              <MediaImage
                media={null}
                label={lead.name}
                imageKeys={[lead.slug, lead.city?.slug, lead.country.slug]}
                sizes="(max-width: 1024px) 92vw, 56vw"
                priority
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
              <p className="text-secondary flex items-center gap-1.5 text-xs/4 font-extrabold tracking-[0.06em] uppercase">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {where(lead)}
                {leadSection && <span className="text-ink-muted">· {leadSection.name}</span>}
              </p>
              <h2 className="display text-[1.5rem]/[1.75rem] text-pretty sm:text-[1.875rem]/[2.125rem]">
                <Link href={href(lead)} className="after:absolute after:inset-0">
                  {lead.name}
                </Link>
              </h2>
              {lead.summary && <p className="text-ink-soft line-clamp-3 text-base/6">{lead.summary}</p>}
              <p className="text-ink-muted mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm font-semibold">
                <span>{lead.program.name}</span>
                {leadDuration && (
                  <span className="flex items-center gap-1.5">
                    <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                    {leadDuration}
                  </span>
                )}
                <span className="text-accent ml-auto flex items-center gap-1.5 font-extrabold">
                  Read the guide
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </p>
            </div>
          </article>

          {side.length > 0 && (
            <ul className="flex flex-col gap-4">
              {side.map((offer) => (
                <li key={offer.id} className="flex-1">
                  <article className="group border-border bg-surface hover:border-border-strong relative flex h-full gap-4 overflow-hidden rounded-lg border p-3 transition-colors">
                    <div className="bg-surface-2 relative h-24 w-28 shrink-0 overflow-hidden rounded-md sm:h-28 sm:w-36">
                      <MediaImage
                        media={null}
                        label={offer.name}
                        imageKeys={[offer.slug, offer.city?.slug, offer.country.slug]}
                        sizes="144px"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col justify-center gap-1">
                      <p className="text-secondary text-xs/4 font-extrabold tracking-[0.06em] uppercase">
                        {where(offer)}
                      </p>
                      <h3 className="display-sm text-[1.0625rem]/[1.375rem] text-pretty">
                        <Link href={href(offer)} className="after:absolute after:inset-0">
                          {offer.name}
                        </Link>
                      </h3>
                      <p className="text-ink-muted text-[0.8125rem]">{offer.program.name}</p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
