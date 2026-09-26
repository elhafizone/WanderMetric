import type { Db } from "@/core/shared/db";
import { fromPostgrestError } from "@/core/shared/errors";
import { err, ok, type Result } from "@/core/shared/result";

/**
 * The partner searches offered on the home page.
 *
 * Each tab submits to `/go/{linkSlug}` with the visitor's search terms; the
 * link row in `affiliate_links` holds the brand's search URL with placeholders
 * (`{q}`, `{q_slug}`, `{origin}`, `{destination}`, `{ddmm}` — see
 * ./destination.ts), and the redirector turns it into a tracked partner link.
 * This file names the slugs and the fields; no URL lives here.
 *
 * Which brand backs each tab follows the programmes this account is connected
 * to on Travelpayouts, and the URL shapes were checked against the live brand
 * sites (September 2026):
 *
 *   flights     Aviasales      /search/{origin}{ddmm}{destination}1
 *   activities  Klook          /en-US/search/result/?query={q}
 *   transfers   Welcome Pickups /{q_slug}/   (city pages, e.g. /paris/)
 *   esim        Airalo         /{q_slug}-esim (country pages)
 *
 * Car hire has no tab: the connected car brands key their pages on their own
 * irregular country slugs ("czech", not "czech-republic"), so a typed country
 * would too often land on a missing page. It is reached through the guides.
 */

export type PartnerSearchKey = "flights" | "activities" | "transfers" | "esim";

export interface PartnerSearch {
  key: PartnerSearchKey;
  /** `affiliate_links.slug` of the search link. */
  linkSlug: string;
  label: string;
  /** Who the search goes to, shown beside the button — disclosure in context. */
  partner: string;
}

export const PARTNER_SEARCHES: readonly PartnerSearch[] = [
  { key: "flights", linkSlug: "search-flights", label: "Flights", partner: "Aviasales" },
  {
    key: "activities",
    linkSlug: "search-things-to-do",
    label: "Things to do",
    partner: "Klook",
  },
  {
    key: "transfers",
    linkSlug: "search-airport-transfers",
    label: "Airport transfers",
    partner: "Welcome Pickups",
  },
  { key: "esim", linkSlug: "search-esim", label: "Travel eSIM", partner: "Airalo" },
];

/**
 * The partner searches whose link is live — active, not deleted, readable by
 * the caller under RLS. A tab is only offered when its link would resolve, so
 * the home page never shows a search that ends in a 404.
 */
export async function listAvailablePartnerSearches(
  db: Db,
): Promise<Result<PartnerSearch[]>> {
  const { data, error } = await db
    .from("affiliate_links")
    .select("slug")
    .in(
      "slug",
      PARTNER_SEARCHES.map((search) => search.linkSlug),
    )
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) return err(fromPostgrestError(error, "listAvailablePartnerSearches"));

  const live = new Set((data ?? []).map((row) => row.slug));
  return ok(PARTNER_SEARCHES.filter((search) => live.has(search.linkSlug)));
}
