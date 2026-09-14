/**
 * Column lists for each read shape.
 *
 * Explicit rather than `select('*')`: these pages are server-rendered on every
 * ISR revalidation, so pulling long body text into a listing query is wasted
 * bandwidth on every single render. Detail shapes fetch the body; card shapes
 * never do.
 */

export const MEDIA_FIELDS = "id, bucket, storage_path, alt_text, width, height, blurhash";

export const COUNTRY_CARD =
  `id, name, slug, iso2, continent, summary, hero:media!countries_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const COUNTRY_DETAIL =
  `id, name, slug, iso2, iso3, continent, currency_code, capital, summary, body, status, published_at,
   hero:media!countries_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const CITY_CARD =
  `id, name, slug, latitude, longitude, iata_code, summary, is_featured,
   country:countries!cities_country_id_fkey(id, name, slug, iso2, continent),
   hero:media!cities_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const DESTINATION_CARD =
  `id, title, slug, excerpt, is_featured, published_at,
   country:countries!destinations_country_id_fkey(id, name, slug, continent),
   city:cities!destinations_city_id_fkey(id, name, slug),
   hero:media!destinations_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const DESTINATION_DETAIL =
  `id, title, slug, excerpt, body, best_time, status, published_at, is_featured,
   country:countries!destinations_country_id_fkey(id, name, slug, iso2, continent),
   city:cities!destinations_city_id_fkey(id, name, slug, latitude, longitude, iata_code),
   author:profiles!destinations_author_id_fkey(id, full_name, avatar_url),
   hero:media!destinations_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const GUIDE_CARD =
  `id, title, slug, excerpt, reading_minutes, published_at, is_featured,
   category:categories!guides_category_id_fkey(id, name, slug),
   hero:media!guides_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const GUIDE_DETAIL =
  `id, title, slug, excerpt, body, reading_minutes, status, published_at,
   category:categories!guides_category_id_fkey(id, name, slug),
   country:countries!guides_country_id_fkey(id, name, slug),
   city:cities!guides_city_id_fkey(id, name, slug),
   author:profiles!guides_author_id_fkey(id, full_name, avatar_url, bio),
   hero:media!guides_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const HOTEL_CARD =
  `id, name, slug, summary, star_rating, is_featured,
   city:cities!hotels_city_id_fkey(id, name, slug, country:countries!cities_country_id_fkey(id, name, slug)),
   hero:media!hotels_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const HOTEL_DETAIL =
  `id, name, slug, summary, body, address, latitude, longitude, star_rating, status, published_at,
   city:cities!hotels_city_id_fkey(id, name, slug, country:countries!cities_country_id_fkey(id, name, slug)),
   hero:media!hotels_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const ACTIVITY_CARD =
  `id, name, slug, kind, summary, duration_minutes, is_featured,
   city:cities!activities_city_id_fkey(id, name, slug, country:countries!cities_country_id_fkey(id, name, slug)),
   hero:media!activities_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const ACTIVITY_DETAIL =
  `id, name, slug, kind, summary, body, duration_minutes, status, published_at,
   category:categories!activities_category_id_fkey(id, name, slug),
   city:cities!activities_city_id_fkey(id, name, slug, country:countries!cities_country_id_fkey(id, name, slug)),
   hero:media!activities_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const DEAL_CARD =
  `id, title, slug, kind, summary, discount_label, starts_at, ends_at, is_featured,
   city:cities!deals_city_id_fkey(id, name, slug),
   hero:media!deals_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const DEAL_DETAIL =
  `id, title, slug, kind, summary, body, discount_label, starts_at, ends_at, status, published_at,
   city:cities!deals_city_id_fkey(id, name, slug),
   country:countries!deals_country_id_fkey(id, name, slug),
   hotel:hotels!deals_hotel_id_fkey(id, name, slug, city:cities!hotels_city_id_fkey(slug)),
   activity:activities!deals_activity_id_fkey(id, name, slug, kind, city:cities!activities_city_id_fkey(slug)),
   hero:media!deals_hero_media_id_fkey(${MEDIA_FIELDS})`;

export const FLIGHT_ROUTE_CARD =
  `id, title, slug, published_at,
   origin:cities!flight_routes_origin_city_id_fkey(id, name, slug, iata_code,
     country:countries!cities_country_id_fkey(id, name, slug)),
   destination:cities!flight_routes_destination_city_id_fkey(id, name, slug, iata_code,
     country:countries!cities_country_id_fkey(id, name, slug))`;

export const FLIGHT_ROUTE_DETAIL = `${FLIGHT_ROUTE_CARD}, body, status`;
