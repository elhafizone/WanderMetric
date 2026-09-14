import { getSiteUrl } from "@/lib/env";

/**
 * Single source of truth for site-level identity. Every metadata, sitemap,
 * robots and structured-data helper reads from here — nothing is hard-coded
 * at the page level.
 */
export const site = {
  name: "WanderMetric",
  tagline: "Travel discovery, measured.",
  description:
    "WanderMetric helps travellers find destinations, stays and things to do — with research-backed guides and transparent recommendations.",
  locale: "en_US",
  twitterHandle: "@wandermetric",
  get url() {
    return getSiteUrl();
  },
} as const;

/**
 * Canonical URL structure. Route builders live here so a slug format can change
 * in one place and every link, sitemap entry and mobile deep link follows.
 */
export const routes = {
  home: () => "/",
  destination: (country: string, city: string) => `/destinations/${country}/${city}`,
  destinationThingsToDo: (country: string, city: string) =>
    `/destinations/${country}/${city}/things-to-do`,
  destinationHotels: (country: string, city: string) =>
    `/destinations/${country}/${city}/hotels`,
  guide: (slug: string) => `/guides/${slug}`,
  itinerary: (slug: string) => `/itineraries/${slug}`,
  deal: (slug: string) => `/deals/${slug}`,
  /** Affiliate redirector. Always noindex, never a canonical target. */
  affiliateRedirect: (slug: string) => `/go/${slug}`,
} as const;

/** Paths that must never be indexed. */
export const disallowedPaths = ["/go/", "/admin/", "/api/"] as const;
