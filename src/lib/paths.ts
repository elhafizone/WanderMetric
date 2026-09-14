import type {
  ActivityCard,
  ActivityDetail,
  DestinationCard,
  DestinationDetail,
  FlightRouteCard,
  HotelCard,
  HotelDetail,
} from "@/core/content/types";

/**
 * URL construction for every content type.
 *
 * Centralised so a URL shape changes in exactly one place and every link,
 * sitemap entry, breadcrumb and future mobile deep link follows. Components
 * never assemble a path by hand.
 */

export function destinationPath(
  destination: Pick<DestinationCard | DestinationDetail, "country" | "city">,
): string {
  return destination.city
    ? `/destinations/${destination.country.slug}/${destination.city.slug}`
    : `/destinations/${destination.country.slug}`;
}

export function countryPath(slug: string): string {
  return `/destinations/${slug}`;
}

export function cityPath(countrySlug: string, citySlug: string): string {
  return `/destinations/${countrySlug}/${citySlug}`;
}

export function guidePath(slug: string): string {
  return `/guides/${slug}`;
}

export function dealPath(slug: string): string {
  return `/deals/${slug}`;
}

export function hotelPath(hotel: Pick<HotelCard | HotelDetail, "city" | "slug">): string {
  return `/hotels/${hotel.city.slug}/${hotel.slug}`;
}

export function hotelCityPath(citySlug: string): string {
  return `/hotels/${citySlug}`;
}

/**
 * Activities and tours share a table but live at different URL roots, because
 * they are different search intents and deserve separate landing pages.
 */
export function activityPath(
  activity: Pick<ActivityCard | ActivityDetail, "kind" | "city" | "slug">,
): string {
  const root = activity.kind === "tour" ? "tours" : "activities";
  return `/${root}/${activity.city.slug}/${activity.slug}`;
}

export function activityCityPath(kind: "activity" | "tour", citySlug: string): string {
  return `/${kind === "tour" ? "tours" : "activities"}/${citySlug}`;
}

export function flightRoutePath(route: Pick<FlightRouteCard, "slug">): string {
  return `/flights/${route.slug}`;
}
