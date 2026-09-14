import type { ActivityKind, ContentStatus, DealKind } from "@/core/shared/db";

/**
 * Domain view models.
 *
 * These describe the shape the application actually consumes, which is not the
 * raw table shape: joins are nested, body text is absent from card shapes, and
 * nothing internal (deleted_at, author_id, search_vector) leaks through.
 *
 * They are declared explicitly rather than inferred from the query builder
 * because PostgREST's embedded-resource syntax produces inference that is both
 * fragile and unreadable at this nesting depth. The single conversion point is
 * `rows()` in ./queries.ts, and the select strings in ./selects.ts are what keep
 * the two in step.
 */

export interface MediaRef {
  id: string;
  bucket: string;
  storage_path: string;
  alt_text: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
}

export interface AuthorRef {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface CountryRef {
  id: string;
  name: string;
  slug: string;
  iso2?: string;
  continent?: string;
}

export interface CityRef {
  id: string;
  name: string;
  slug: string;
  latitude?: number | null;
  longitude?: number | null;
  iata_code?: string | null;
  country?: CountryRef | null;
}

export interface CountryCard extends CountryRef {
  summary: string | null;
  hero: MediaRef | null;
}

export interface CountryDetail extends CountryCard {
  iso3: string | null;
  currency_code: string | null;
  capital: string | null;
  body: string | null;
  status: ContentStatus;
  published_at: string | null;
}

export interface CityCard extends CityRef {
  summary: string | null;
  is_featured: boolean;
  hero: MediaRef | null;
}

export interface DestinationCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  is_featured: boolean;
  published_at: string | null;
  country: CountryRef;
  city: CityRef | null;
  hero: MediaRef | null;
}

export interface DestinationDetail extends DestinationCard {
  body: string | null;
  best_time: string | null;
  status: ContentStatus;
  author: AuthorRef | null;
}

export interface GuideCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  reading_minutes: number | null;
  published_at: string | null;
  is_featured: boolean;
  category: CategoryRef | null;
  hero: MediaRef | null;
}

export interface GuideDetail extends GuideCard {
  body: string | null;
  status: ContentStatus;
  country: CountryRef | null;
  city: CityRef | null;
  author: AuthorRef | null;
}

export interface HotelCard {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  star_rating: number | null;
  is_featured: boolean;
  city: CityRef;
  hero: MediaRef | null;
}

export interface HotelDetail extends HotelCard {
  body: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ContentStatus;
  published_at: string | null;
}

export interface ActivityCard {
  id: string;
  name: string;
  slug: string;
  kind: ActivityKind;
  summary: string | null;
  duration_minutes: number | null;
  is_featured: boolean;
  city: CityRef;
  hero: MediaRef | null;
}

export interface ActivityDetail extends ActivityCard {
  body: string | null;
  status: ContentStatus;
  published_at: string | null;
  category: CategoryRef | null;
}

export interface DealCard {
  id: string;
  title: string;
  slug: string;
  kind: DealKind;
  summary: string | null;
  /** Editor-supplied label such as "up to 30% off" — never a computed price. */
  discount_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_featured: boolean;
  city: CityRef | null;
  hero: MediaRef | null;
}

export interface DealDetail extends DealCard {
  body: string | null;
  status: ContentStatus;
  published_at: string | null;
  country: CountryRef | null;
  hotel: { id: string; name: string; slug: string; city: { slug: string } | null } | null;
  activity: {
    id: string;
    name: string;
    slug: string;
    kind: ActivityKind;
    city: { slug: string } | null;
  } | null;
}

export interface FlightRouteCard {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
  origin: CityRef;
  destination: CityRef;
}

export interface FlightRouteDetail extends FlightRouteCard {
  body: string | null;
  status: ContentStatus;
}

export interface SearchHit {
  content_type: string;
  id: string;
  title: string;
  slug: string;
  path: string;
  summary: string | null;
  image_id: string | null;
  rank: number;
}

export interface PlaceSuggestion {
  kind: string;
  id: string;
  label: string;
  path: string;
  score: number;
}
