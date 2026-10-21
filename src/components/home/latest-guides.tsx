import { OfferCard, OfferRow } from "@/components/offer/offer-card";
import type { OfferCard as OfferCardData } from "@/core/offers/offers";

/**
 * The newest guides: one large card and a short run beside it.
 *
 * A single offer is just the large card; two or three fill the run. The
 * composition is the point - a grid of six equal cards reads as a catalogue,
 * this reads as an edit.
 */
export function LatestGuides({ offers }: { offers: OfferCardData[] }) {
  const [lead, ...rest] = offers;
  if (!lead) return null;
  const run = rest.slice(0, 3);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className={run.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
        <OfferCard offer={lead} lead ratio="aspect-[4/3] lg:aspect-[3/2]" />
      </div>
      {run.length > 0 && (
        <ul className="divide-border flex flex-col divide-y lg:col-span-5">
          {run.map((offer) => (
            <li key={offer.id}>
              <OfferRow offer={offer} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
