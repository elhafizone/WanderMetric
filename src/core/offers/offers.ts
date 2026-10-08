import type { PostgrestError } from "@supabase/supabase-js";

import { offerPhotoCredit, offerPhotos } from "@/core/content/offer-facts";
import type { SectionSlug } from "@/core/sections/sections";
import type { Db } from "@/core/shared/db";
import { fromPostgrestError } from "@/core/shared/errors";
import {
  normalizePageRequest,
  paginate,
  toRange,
  type Paginated,
} from "@/core/shared/pagination";
import { appError, err, ok, type Result } from "@/core/shared/result";

/**
 * Read side of the offers domain. Framework-free: every function takes the
 * Supabase client, so the same query runs under an anonymous visitor's RLS or a
 * signed-in editor's depending only on what the caller passes.
 */

export interface OfferCountry {
  id: string;
  name: string;
  slug: string;
}

export interface OfferCard {
  id: string;
  name: string;
  slug: string;
  section: SectionSlug;
  summary: string | null;
  duration_minutes: number | null;
  is_featured: boolean;
  country: OfferCountry;
  city: OfferCountry | null;
  program: { slug: string; name: string };
  /** Raw `facts.images` and `facts.image_credit`; read them with `offerCardPhoto`. */
  images?: unknown;
  image_credit?: string | null;
}

/** The first photograph the partner's listing shows for this offer, with its credit. */
export function offerCardPhoto(
  offer: Pick<OfferCard, "images" | "image_credit">,
): { url: string; alt: string; credit: string } | null {
  const credit = offerPhotoCredit({ image_credit: offer.image_credit });
  const first = offerPhotos({ images: offer.images })[0];
  return credit && first ? { url: first.url, alt: first.alt, credit } : null;
}

export interface OfferDetail extends OfferCard {
  body: string | null;
  facts: Record<string, unknown>;
  facts_read_on: string | null;
  source_url: string | null;
  price_note: string | null;
  published_at: string | null;
  /** The `affiliate_links.slug` behind /go/{slug}. */
  link: { slug: string } | null;
}

const CARD = `id, name, slug, section, summary, duration_minutes, is_featured,
   images:facts->images, image_credit:facts->>image_credit,
   country:countries!offers_country_id_fkey!inner(id, name, slug),
   city:cities!offers_city_id_fkey(id, name, slug),
   program:affiliate_programs!offers_program_id_fkey!inner(slug, name)`;

const DETAIL = `${CARD}, body, facts, facts_read_on, source_url, price_note, published_at,
   link:affiliate_links!offers_affiliate_link_id_fkey(slug)`;

/**
 * Same card, but the city embed is an inner join. Filtering on an embedded
 * column without `!inner` returns the parent row with a null embed instead of
 * excluding it, so the city filter must use this select.
 */
const CARD_IN_CITY = CARD.replace(
  "city:cities!offers_city_id_fkey(",
  "city:cities!offers_city_id_fkey!inner(",
);

function rows<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

function fail(error: PostgrestError, context: string) {
  return err(fromPostgrestError(error, context));
}

export interface ListOffersOptions {
  section?: SectionSlug;
  countrySlug?: string;
  /** Restricts to one city; combine with `countrySlug`, since slugs are unique per country. */
  citySlug?: string;
  featuredOnly?: boolean;
  page?: number;
  perPage?: number;
}

export async function listOffers(
  db: Db,
  options: ListOffersOptions = {},
): Promise<Result<Paginated<OfferCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  let query = db
    .from("offers")
    .select(options.citySlug ? CARD_IN_CITY : CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });

  if (options.section) query = query.eq("section", options.section);
  if (options.countrySlug) query = query.eq("countries.slug", options.countrySlug);
  if (options.citySlug) query = query.eq("cities.slug", options.citySlug);
  if (options.featuredOnly) query = query.eq("is_featured", true);

  const { data, error, count } = await query.range(from, to);
  if (error) return fail(error, "listOffers");
  return ok(paginate(rows<OfferCard>(data), request, count ?? 0));
}

export async function getOffer(
  db: Db,
  section: SectionSlug,
  countrySlug: string,
  slug: string,
): Promise<Result<OfferDetail>> {
  const { data, error } = await db
    .from("offers")
    .select(DETAIL)
    .eq("section", section)
    .eq("slug", slug)
    .eq("countries.slug", countrySlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return fail(error, "getOffer");
  if (!data) {
    return err(appError("NOT_FOUND", "Offer not found", { publicMessage: "Not found." }));
  }
  return ok(data as unknown as OfferDetail);
}

export interface CountryWithOffers extends OfferCountry {
  offerCount: number;
}

/**
 * Countries that have at least one published offer, with the number of offers.
 * The corpus is small, so this reads the two columns it needs and counts in
 * memory instead of adding an aggregate function.
 */
export async function listCountriesWithOffers(
  db: Db,
  section?: SectionSlug,
): Promise<Result<CountryWithOffers[]>> {
  let query = db
    .from("offers")
    .select("country:countries!offers_country_id_fkey!inner(id, name, slug)")
    .is("deleted_at", null);
  if (section) query = query.eq("section", section);

  const { data, error } = await query.limit(5000);
  if (error) return fail(error, "listCountriesWithOffers");

  const byId = new Map<string, CountryWithOffers>();
  for (const entry of rows<{ country: OfferCountry }>(data)) {
    const existing = byId.get(entry.country.id);
    if (existing) existing.offerCount += 1;
    else byId.set(entry.country.id, { ...entry.country, offerCount: 1 });
  }
  return ok([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
}

export interface CityWithOffers extends OfferCountry {
  offerCount: number;
}

/** Cities of one country that have at least one offer, with the offer count. */
export async function listCitiesWithOffers(
  db: Db,
  countrySlug: string,
): Promise<Result<CityWithOffers[]>> {
  const { data, error } = await db
    .from("offers")
    .select(
      `city:cities!offers_city_id_fkey!inner(id, name, slug),
       country:countries!offers_country_id_fkey!inner(slug)`,
    )
    .eq("countries.slug", countrySlug)
    .is("deleted_at", null)
    .limit(5000);
  if (error) return fail(error, "listCitiesWithOffers");

  const byId = new Map<string, CityWithOffers>();
  for (const entry of rows<{ city: OfferCountry }>(data)) {
    const existing = byId.get(entry.city.id);
    if (existing) existing.offerCount += 1;
    else byId.set(entry.city.id, { ...entry.city, offerCount: 1 });
  }
  return ok([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
}

/** A photograph taken from one of the offers' own partner listings. */
export interface DestinationPhoto {
  url: string;
  alt: string;
  /** The partner the photograph comes from, e.g. "Tiqets". */
  credit: string;
}

export interface DestinationCity extends CityWithOffers {
  photo: DestinationPhoto | null;
}

export interface DestinationCountry extends CountryWithOffers {
  photo: DestinationPhoto | null;
  cities: DestinationCity[];
}

/**
 * Every country that has at least one offer, each with the cities that have
 * offers, busiest first. One query feeds the whole destinations page.
 *
 * A country or city card is illustrated by a photograph from one of its own
 * offers' partner listings (`facts.images`), never by a stock image, so what the
 * card shows is something the partner itself shows for an offer there. With no
 * such offer photo the card has none.
 */
export async function listDestinations(db: Db): Promise<Result<DestinationCountry[]>> {
  const { data, error } = await db
    .from("offers")
    .select(
      `images:facts->images, image_credit:facts->>image_credit,
       country:countries!offers_country_id_fkey!inner(id, name, slug),
       city:cities!offers_city_id_fkey(id, name, slug)`,
    )
    .is("deleted_at", null)
    .limit(5000);
  if (error) return fail(error, "listDestinations");

  const countries = new Map<string, DestinationCountry>();
  // Every photograph an offer in the country shows, so the country card can pick
  // one that is not the picture its cities already use.
  const pool = new Map<string, DestinationPhoto[]>();
  for (const entry of rows<{
    images: unknown;
    image_credit: string | null;
    country: OfferCountry;
    city: OfferCountry | null;
  }>(data)) {
    const credit = offerPhotoCredit({ image_credit: entry.image_credit });
    const photos: DestinationPhoto[] = credit
      ? offerPhotos({ images: entry.images }).map((p) => ({ url: p.url, alt: p.alt, credit }))
      : [];

    let country = countries.get(entry.country.id);
    if (!country) {
      country = { ...entry.country, offerCount: 0, photo: null, cities: [] };
      countries.set(entry.country.id, country);
      pool.set(entry.country.id, []);
    }
    country.offerCount += 1;
    pool.get(entry.country.id)?.push(...photos);
    if (entry.city) {
      const existing = country.cities.find((city) => city.id === entry.city?.id);
      if (existing) {
        existing.offerCount += 1;
        existing.photo ??= photos[0] ?? null;
      } else {
        country.cities.push({ ...entry.city, offerCount: 1, photo: photos[0] ?? null });
      }
    }
  }
  for (const country of countries.values()) {
    country.cities.sort((a, b) => b.offerCount - a.offerCount || a.name.localeCompare(b.name));
    const candidates = pool.get(country.id) ?? [];
    const used = new Set(country.cities.slice(0, 2).map((city) => city.photo?.url));
    country.photo = candidates.find((photo) => !used.has(photo.url)) ?? candidates[0] ?? null;
  }
  return ok(
    [...countries.values()].sort(
      (a, b) => b.offerCount - a.offerCount || a.name.localeCompare(b.name),
    ),
  );
}

/** Published offers per section, for the home grid and the section menu. */
export async function countOffersBySection(db: Db): Promise<Result<Record<string, number>>> {
  const { data, error } = await db
    .from("offers")
    .select("section")
    .is("deleted_at", null)
    .limit(5000);
  if (error) return fail(error, "countOffersBySection");

  const counts: Record<string, number> = {};
  for (const entry of rows<{ section: string }>(data)) {
    counts[entry.section] = (counts[entry.section] ?? 0) + 1;
  }
  return ok(counts);
}

/** Everything the sitemap needs: the paths and the last change of every offer. */
export async function listOfferSitemapEntries(
  db: Db,
): Promise<
  Result<
    { section: SectionSlug; countrySlug: string; slug: string; updatedAt: string | null }[]
  >
> {
  const { data, error } = await db
    .from("offers")
    .select("section, slug, updated_at, country:countries!offers_country_id_fkey!inner(slug)")
    .is("deleted_at", null)
    .limit(5000);
  if (error) return fail(error, "listOfferSitemapEntries");

  return ok(
    rows<{
      section: SectionSlug;
      slug: string;
      updated_at: string | null;
      country: { slug: string };
    }>(data).map((entry) => ({
      section: entry.section,
      countrySlug: entry.country.slug,
      slug: entry.slug,
      updatedAt: entry.updated_at,
    })),
  );
}

/**
 * Search by name or summary. The query is stripped of the characters PostgREST
 * treats as filter syntax before it is placed in the filter, so a visitor cannot
 * alter the query shape.
 */
export async function searchOffers(
  db: Db,
  rawQuery: string,
  options: { page?: number; perPage?: number } = {},
): Promise<Result<Paginated<OfferCard>>> {
  const term = rawQuery.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
  const request = normalizePageRequest(options.page, options.perPage);
  if (term.length < 2) return ok(paginate([], request, 0));

  const [from, to] = toRange(request);
  const { data, error, count } = await db
    .from("offers")
    .select(CARD, { count: "exact" })
    .is("deleted_at", null)
    .or(`name.ilike.%${term}%,summary.ilike.%${term}%`)
    .order("name", { ascending: true })
    .range(from, to);

  if (error) return fail(error, "searchOffers");
  return ok(paginate(rows<OfferCard>(data), request, count ?? 0));
}
