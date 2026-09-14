import type { PostgrestError } from "@supabase/supabase-js";

import * as S from "@/core/content/selects";
import type {
  ActivityCard,
  ActivityDetail,
  CityCard,
  CountryCard,
  CountryDetail,
  DealCard,
  DealDetail,
  DestinationCard,
  DestinationDetail,
  FlightRouteCard,
  FlightRouteDetail,
  GuideCard,
  GuideDetail,
  HotelCard,
  HotelDetail,
  PlaceSuggestion,
  SearchHit,
} from "@/core/content/types";
import type { ActivityKind, Db } from "@/core/shared/db";
import { fromPostgrestError } from "@/core/shared/errors";
import {
  normalizePageRequest,
  paginate,
  toRange,
  type Paginated,
} from "@/core/shared/pagination";
import { appError, err, ok, type Result } from "@/core/shared/result";

/**
 * Read side of the content domain.
 *
 * Every function takes the Supabase client as an argument and never constructs
 * one, so the identical query runs under an anonymous visitor's RLS, a signed-in
 * editor's, or the service role depending only on what the caller passes. That
 * is what keeps this module free of any request or framework concern — and what
 * lets a future mobile backend reuse it untouched.
 */

/**
 * Single conversion point between PostgREST's response and our view models.
 * The select strings in ./selects.ts are the contract; this is where it is
 * asserted, and the only place a cast is permitted.
 */
function rows<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

function row<T>(data: unknown): T {
  return data as T;
}

function fail(error: PostgrestError, context: string) {
  return err(fromPostgrestError(error, context));
}

const NOT_FOUND = (what: string) =>
  appError("NOT_FOUND", `${what} not found`, { publicMessage: "Not found." });

export interface ListOptions {
  page?: number;
  perPage?: number;
}

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

export async function listCountries(
  db: Db,
  options: ListOptions & { continent?: string } = {},
): Promise<Result<Paginated<CountryCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  let query = db
    .from("countries")
    .select(S.COUNTRY_CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("name");

  if (options.continent) {
    query = query.eq("continent", options.continent as never);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) return fail(error, "listCountries");
  return ok(paginate(rows<CountryCard>(data), request, count ?? 0));
}

export async function getCountryBySlug(
  db: Db,
  slug: string,
): Promise<Result<CountryDetail>> {
  const { data, error } = await db
    .from("countries")
    .select(S.COUNTRY_DETAIL)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return fail(error, "getCountryBySlug");
  if (!data) return err(NOT_FOUND("Country"));
  return ok(row<CountryDetail>(data));
}

export async function listCities(
  db: Db,
  options: ListOptions & { countrySlug?: string; featuredOnly?: boolean } = {},
): Promise<Result<Paginated<CityCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  let query = db
    .from("cities")
    .select(S.CITY_CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("name");

  if (options.countrySlug) query = query.eq("countries.slug", options.countrySlug);
  if (options.featuredOnly) query = query.eq("is_featured", true);

  const { data, error, count } = await query.range(from, to);
  if (error) return fail(error, "listCities");
  return ok(paginate(rows<CityCard>(data), request, count ?? 0));
}

// ---------------------------------------------------------------------------
// Destinations
//
// A destination with a city is a city page; without one, a country page. That
// single table is what makes /destinations/{country} and
// /destinations/{country}/{city} one code path instead of two.
// ---------------------------------------------------------------------------

export async function listDestinations(
  db: Db,
  options: ListOptions & { featuredOnly?: boolean; countrySlug?: string } = {},
): Promise<Result<Paginated<DestinationCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  let query = db
    .from("destinations")
    .select(S.DESTINATION_CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (options.featuredOnly) query = query.eq("is_featured", true);
  if (options.countrySlug) query = query.eq("countries.slug", options.countrySlug);

  const { data, error, count } = await query.range(from, to);
  if (error) return fail(error, "listDestinations");
  return ok(paginate(rows<DestinationCard>(data), request, count ?? 0));
}

/** Resolves /destinations/{countrySlug}[/{citySlug}] to a single record. */
export async function getDestinationByPath(
  db: Db,
  countrySlug: string,
  citySlug?: string,
): Promise<Result<DestinationDetail>> {
  const country = await db
    .from("countries")
    .select("id")
    .eq("slug", countrySlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (country.error) return fail(country.error, "getDestinationByPath.country");
  if (!country.data) return err(NOT_FOUND("Destination"));

  let query = db
    .from("destinations")
    .select(S.DESTINATION_DETAIL)
    .eq("country_id", country.data.id)
    .is("deleted_at", null);

  if (citySlug) {
    const city = await db
      .from("cities")
      .select("id")
      .eq("country_id", country.data.id)
      .eq("slug", citySlug)
      .is("deleted_at", null)
      .maybeSingle();

    if (city.error) return fail(city.error, "getDestinationByPath.city");
    if (!city.data) return err(NOT_FOUND("Destination"));
    query = query.eq("city_id", city.data.id);
  } else {
    query = query.is("city_id", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) return fail(error, "getDestinationByPath");
  if (!data) return err(NOT_FOUND("Destination"));
  return ok(row<DestinationDetail>(data));
}

// ---------------------------------------------------------------------------
// Guides
// ---------------------------------------------------------------------------

export async function listGuides(
  db: Db,
  options: ListOptions & {
    featuredOnly?: boolean;
    categorySlug?: string;
    cityId?: string;
    destinationId?: string;
  } = {},
): Promise<Result<Paginated<GuideCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  let query = db
    .from("guides")
    .select(S.GUIDE_CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (options.featuredOnly) query = query.eq("is_featured", true);
  if (options.categorySlug) query = query.eq("categories.slug", options.categorySlug);
  if (options.cityId) query = query.eq("city_id", options.cityId);
  if (options.destinationId) query = query.eq("destination_id", options.destinationId);

  const { data, error, count } = await query.range(from, to);
  if (error) return fail(error, "listGuides");
  return ok(paginate(rows<GuideCard>(data), request, count ?? 0));
}

export async function getGuideBySlug(db: Db, slug: string): Promise<Result<GuideDetail>> {
  const { data, error } = await db
    .from("guides")
    .select(S.GUIDE_DETAIL)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return fail(error, "getGuideBySlug");
  if (!data) return err(NOT_FOUND("Guide"));
  return ok(row<GuideDetail>(data));
}

// ---------------------------------------------------------------------------
// Hotels
// ---------------------------------------------------------------------------

export async function listHotels(
  db: Db,
  options: ListOptions & { citySlug?: string; featuredOnly?: boolean } = {},
): Promise<Result<Paginated<HotelCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  let query = db
    .from("hotels")
    .select(S.HOTEL_CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("name");

  if (options.citySlug) query = query.eq("cities.slug", options.citySlug);
  if (options.featuredOnly) query = query.eq("is_featured", true);

  const { data, error, count } = await query.range(from, to);
  if (error) return fail(error, "listHotels");
  return ok(paginate(rows<HotelCard>(data), request, count ?? 0));
}

export async function getHotelBySlug(
  db: Db,
  citySlug: string,
  slug: string,
): Promise<Result<HotelDetail>> {
  const { data, error } = await db
    .from("hotels")
    .select(S.HOTEL_DETAIL)
    .eq("slug", slug)
    .eq("cities.slug", citySlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return fail(error, "getHotelBySlug");
  if (!data) return err(NOT_FOUND("Hotel"));
  return ok(row<HotelDetail>(data));
}

// ---------------------------------------------------------------------------
// Activities and tours — one table, discriminated by `kind`.
// ---------------------------------------------------------------------------

export async function listActivities(
  db: Db,
  options: ListOptions & {
    kind?: ActivityKind;
    citySlug?: string;
    featuredOnly?: boolean;
  } = {},
): Promise<Result<Paginated<ActivityCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  let query = db
    .from("activities")
    .select(S.ACTIVITY_CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("name");

  if (options.kind) query = query.eq("kind", options.kind);
  if (options.citySlug) query = query.eq("cities.slug", options.citySlug);
  if (options.featuredOnly) query = query.eq("is_featured", true);

  const { data, error, count } = await query.range(from, to);
  if (error) return fail(error, "listActivities");
  return ok(paginate(rows<ActivityCard>(data), request, count ?? 0));
}

export async function getActivityBySlug(
  db: Db,
  kind: ActivityKind,
  citySlug: string,
  slug: string,
): Promise<Result<ActivityDetail>> {
  const { data, error } = await db
    .from("activities")
    .select(S.ACTIVITY_DETAIL)
    .eq("kind", kind)
    .eq("slug", slug)
    .eq("cities.slug", citySlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return fail(error, "getActivityBySlug");
  if (!data) return err(NOT_FOUND(kind === "tour" ? "Tour" : "Activity"));
  return ok(row<ActivityDetail>(data));
}

// ---------------------------------------------------------------------------
// Deals. RLS already hides expired deals, so no end-date filter is repeated
// here — the database is the single place that rule lives.
// ---------------------------------------------------------------------------

export async function listDeals(
  db: Db,
  options: ListOptions & { featuredOnly?: boolean } = {},
): Promise<Result<Paginated<DealCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  let query = db
    .from("deals")
    .select(S.DEAL_CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("ends_at", { ascending: true, nullsFirst: false });

  if (options.featuredOnly) query = query.eq("is_featured", true);

  const { data, error, count } = await query.range(from, to);
  if (error) return fail(error, "listDeals");
  return ok(paginate(rows<DealCard>(data), request, count ?? 0));
}

export async function getDealBySlug(db: Db, slug: string): Promise<Result<DealDetail>> {
  const { data, error } = await db
    .from("deals")
    .select(S.DEAL_DETAIL)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return fail(error, "getDealBySlug");
  if (!data) return err(NOT_FOUND("Deal"));
  return ok(row<DealDetail>(data));
}

// ---------------------------------------------------------------------------
// Flight routes. Editorial pages only — live fares come from providers at
// request time and are never persisted.
// ---------------------------------------------------------------------------

export async function listFlightRoutes(
  db: Db,
  options: ListOptions = {},
): Promise<Result<Paginated<FlightRouteCard>>> {
  const request = normalizePageRequest(options.page, options.perPage);
  const [from, to] = toRange(request);

  const { data, error, count } = await db
    .from("flight_routes")
    .select(S.FLIGHT_ROUTE_CARD, { count: "exact" })
    .is("deleted_at", null)
    .order("title")
    .range(from, to);

  if (error) return fail(error, "listFlightRoutes");
  return ok(paginate(rows<FlightRouteCard>(data), request, count ?? 0));
}

export async function getFlightRouteBySlug(
  db: Db,
  slug: string,
): Promise<Result<FlightRouteDetail>> {
  const { data, error } = await db
    .from("flight_routes")
    .select(S.FLIGHT_ROUTE_DETAIL)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return fail(error, "getFlightRouteBySlug");
  if (!data) return err(NOT_FOUND("Flight route"));
  return ok(row<FlightRouteDetail>(data));
}

// ---------------------------------------------------------------------------
// Search — delegated to Postgres. See migration 0010.
// ---------------------------------------------------------------------------

export async function searchContent(
  db: Db,
  query: string,
  options: ListOptions & { type?: string } = {},
): Promise<Result<Paginated<SearchHit>>> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return ok(paginate<SearchHit>([], normalizePageRequest(options.page, options.perPage), 0));
  }

  const request = normalizePageRequest(options.page, options.perPage);
  const [from] = toRange(request);

  // Over-fetch by one to detect a further page without a second count query:
  // ts_rank has no cheap exact count, and an approximate total would be worse
  // than an honest "there is more".
  const { data, error } = await db.rpc("search_content", {
    search_query: trimmed,
    result_limit: request.perPage + 1,
    result_offset: from,
    filter_type: (options.type ?? null) as never,
  });

  if (error) return fail(error, "searchContent");

  const all = rows<SearchHit>(data);
  const items = all.slice(0, request.perPage);
  const hasMore = all.length > request.perPage;
  const total = from + items.length + (hasMore ? 1 : 0);

  return ok(paginate(items, request, total));
}

export async function suggestPlaces(
  db: Db,
  query: string,
  limit = 8,
): Promise<Result<PlaceSuggestion[]>> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return ok([]);

  const { data, error } = await db.rpc("suggest_places", {
    search_query: trimmed,
    result_limit: limit,
  });

  if (error) return fail(error, "suggestPlaces");
  return ok(rows<PlaceSuggestion>(data));
}
