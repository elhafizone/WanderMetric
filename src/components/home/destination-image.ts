import { editorialImage } from "@/core/media/imagery";
import type { DestinationCountry } from "@/core/offers/offers";

/** What a destination tile needs to draw a photograph and credit it. */
export interface DestinationPicture {
  src: string;
  alt: string;
  /** Who to thank: the partner whose listing shows it, or the photographer. */
  credit: string;
  /** A partner's own image (served from their CDN) as opposed to one of ours. */
  remote: boolean;
  focus: string | null;
}

/**
 * The photograph for a country tile.
 *
 * First choice is a picture one of the country's own offers shows on its
 * partner listing, credited to that partner, exactly as the destinations page
 * does. Where no offer carries one, a photograph from our own registry of a
 * place *in* that country is used (for Portugal, Lisbon), described by what is
 * in the frame. A country with neither gets no tile rather than a stand-in.
 */
export function destinationPicture(country: DestinationCountry): DestinationPicture | null {
  if (country.photo) {
    return {
      src: country.photo.url,
      alt: country.photo.alt,
      credit: country.photo.credit,
      remote: true,
      focus: null,
    };
  }
  const own = editorialImage(country.slug, ...country.cities.map((city) => city.slug));
  if (!own) return null;
  return {
    src: own.src,
    alt: own.alt,
    credit: `${own.credit.photographer} / ${own.credit.source}`,
    remote: false,
    focus: own.focus ?? null,
  };
}
