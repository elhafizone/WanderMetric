import type {
  AffiliateProvider,
  DeepLinkInput,
  DeepLinkResult,
  ProviderOffer,
  SearchQuery,
} from "@/core/affiliate/provider";
import { appError, err, ok, type Result } from "@/core/shared/result";

/**
 * Travelpayouts adapter.
 *
 * Verified against Travelpayouts' published documentation (September 2026):
 *
 *   Auth            `x-access-token` header, or a `token` query parameter.
 *   Flight data v1  https://api.travelpayouts.com/v1/prices/{cheap,direct,calendar,monthly}
 *                   plus /city-directions and /airline-directions.
 *   Attribution     `marker` identifies the affiliate; `sub_id` is the free-text
 *                   sub-identifier that appears in Travelpayouts statistics. We
 *                   send our click UUID as `sub_id`, which is what makes a
 *                   conversion traceable back to a page.
 *   Rate limit      The partner-links API is documented at 100 requests per
 *                   minute per marker, 10 links per request.
 *
 * Travelpayouts is an aggregator: one integration reaches Booking.com, Viator,
 * GetYourGuide and 100+ other brands, which is why it is the first adapter.
 *
 * Nothing here is implemented speculatively. `fetchConversions` is absent and
 * `conversionFeed` is false because the statistics API was NOT verified during
 * this build — see docs/travelpayouts.md. Claiming it would be worse than
 * lacking it.
 */

const API_BASE = "https://api.travelpayouts.com";
const REQUEST_TIMEOUT_MS = 8000;

export interface TravelpayoutsConfig {
  /** Affiliate ID. Without it no link can be attributed, so none is emitted. */
  marker: string;
  /** Required only for the data APIs, not for deep links. */
  apiToken?: string;
  currency?: string;
  locale?: string;
}

/** Reads configuration from the environment. Returns null when unset. */
export function travelpayoutsConfigFromEnv(): TravelpayoutsConfig | null {
  const marker = process.env.TRAVELPAYOUTS_MARKER?.trim();
  if (!marker) return null;

  return {
    marker,
    apiToken: process.env.TRAVELPAYOUTS_API_TOKEN?.trim() || undefined,
    currency: process.env.TRAVELPAYOUTS_CURRENCY?.trim() || "usd",
    locale: process.env.TRAVELPAYOUTS_LOCALE?.trim() || "en",
  };
}

const NOT_CONFIGURED = appError(
  "NOT_CONFIGURED",
  "Travelpayouts is not configured: TRAVELPAYOUTS_MARKER is missing",
  { publicMessage: "This offer is temporarily unavailable." },
);

function missingToken(what: string) {
  return appError(
    "NOT_CONFIGURED",
    `Travelpayouts ${what} requires TRAVELPAYOUTS_API_TOKEN`,
    {
      publicMessage: "This information is temporarily unavailable.",
    },
  );
}

/**
 * Applies attribution to a destination URL.
 *
 * A template wins when the link row defines one, so an editor can express a
 * brand-specific URL shape without a code change. Otherwise marker and sub_id
 * are appended, preserving any query string the destination already carries.
 */
function applyAttribution(
  destinationUrl: string,
  config: TravelpayoutsConfig,
  input: DeepLinkInput,
  template?: string | null,
): string {
  if (template) {
    return template
      .replaceAll("{marker}", encodeURIComponent(config.marker))
      .replaceAll("{clickId}", encodeURIComponent(input.clickId))
      .replaceAll("{subId}", encodeURIComponent(input.clickId))
      .replaceAll("{url}", encodeURIComponent(destinationUrl))
      .replaceAll("{campaign}", encodeURIComponent(input.campaign ?? ""));
  }

  const url = new URL(destinationUrl);
  url.searchParams.set("marker", config.marker);
  url.searchParams.set("sub_id", input.clickId);

  for (const [key, value] of Object.entries(input.params ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

async function getJson<T>(path: string, token: string): Promise<Result<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "x-access-token": token, accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.status === 429) {
      return err(
        appError("RATE_LIMITED", "Travelpayouts rate limit reached", {
          publicMessage: "Too many requests. Please try again shortly.",
        }),
      );
    }
    if (!response.ok) {
      return err(
        appError(
          "PROVIDER_ERROR",
          `Travelpayouts responded ${response.status} for ${path}`,
          {
            publicMessage: "This information is temporarily unavailable.",
          },
        ),
      );
    }

    return ok((await response.json()) as T);
  } catch (error) {
    return err(
      appError(
        "PROVIDER_ERROR",
        `Travelpayouts request failed: ${error instanceof Error ? error.message : "unknown"}`,
        { publicMessage: "This information is temporarily unavailable." },
      ),
    );
  }
}

/** Shape of a /v1/prices/cheap entry, per the published response format. */
interface CheapPriceEntry {
  price?: number;
  airline?: string;
  flight_number?: number | string;
  departure_at?: string;
  return_at?: string;
  expires_at?: string;
}

export function createTravelpayoutsProvider(
  config: TravelpayoutsConfig,
): AffiliateProvider {
  return {
    slug: "travelpayouts",
    displayName: "Travelpayouts",
    verticals: ["flights", "hotels", "activities", "tours", "cars", "insurance"],
    capabilities: {
      deepLinks: true,
      // Flights only. Hotel and activity inventory reaches us through brand
      // widgets and deep links, not through this data API.
      search: Boolean(config.apiToken),
      conversionFeed: false,
      conversionWebhook: false,
      subIdTracking: true,
    },

    async buildDeepLink(input: DeepLinkInput): Promise<Result<DeepLinkResult>> {
      if (!config.marker) return err(NOT_CONFIGURED);

      try {
        const url = applyAttribution(
          input.destinationUrl,
          config,
          input,
          input.deepLinkTemplate,
        );
        return ok({ url, trackingAttached: true });
      } catch {
        return err(
          appError(
            "VALIDATION_FAILED",
            `Invalid destination URL: ${input.destinationUrl}`,
            {
              publicMessage: "This link is misconfigured.",
            },
          ),
        );
      }
    },

    async search(query: SearchQuery): Promise<Result<ProviderOffer[]>> {
      if (query.vertical !== "flights") {
        return err(
          appError(
            "PROVIDER_ERROR",
            `Travelpayouts search does not cover ${query.vertical}`,
            {
              publicMessage: "Search is unavailable for this category.",
            },
          ),
        );
      }
      if (!config.apiToken) return err(missingToken("flight search"));

      // `query` carries "ORIGIN-DESTINATION" as IATA codes, which is why cities
      // store iata_code: guessing an airport from a city name would be wrong
      // often enough to matter.
      const [origin, destination] = query.query
        .split("-")
        .map((part) => part.trim().toUpperCase());
      if (!origin || !destination) {
        return err(
          appError(
            "VALIDATION_FAILED",
            "Flight search expects 'ORIGIN-DESTINATION' IATA codes",
            {
              publicMessage: "Invalid route.",
            },
          ),
        );
      }

      const params = new URLSearchParams({
        origin,
        destination,
        currency: query.currency ?? config.currency ?? "usd",
      });

      const response = await getJson<{
        data?: Record<string, Record<string, CheapPriceEntry>>;
      }>(`/v1/prices/cheap?${params}`, config.apiToken);
      if (!response.ok) return response;

      const offers: ProviderOffer[] = [];
      for (const [destinationCode, entries] of Object.entries(response.data.data ?? {})) {
        for (const [variant, entry] of Object.entries(entries)) {
          if (typeof entry?.price !== "number") continue;
          offers.push({
            externalId: `${origin}-${destinationCode}-${variant}`,
            title: `${origin} → ${destinationCode}`,
            url: `https://www.aviasales.com/search/${origin}${destinationCode}`,
            price: {
              amount: entry.price,
              currency: query.currency ?? config.currency ?? "usd",
            },
            raw: entry,
          });
        }
      }

      return ok(offers.slice(0, query.limit ?? 20));
    },
  };
}
