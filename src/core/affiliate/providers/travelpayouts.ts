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
 *   Partner links   POST https://api.travelpayouts.com/links/v1/create with
 *                   { trs, marker, shorten, links: [{ url, sub_id }] } returns
 *                   `partner_url` for each brand URL. This is the documented
 *                   way to turn a brand page into a tracked link. Appending
 *                   `?marker=` to a brand URL is not, and earns nothing on the
 *                   brands this account is connected to. Unavailable for
 *                   Kiwi.com, Expedia UK, HolidayTaxis, Ticketmaster, Priority
 *                   Pass and Indrive.
 *   Attribution     `marker` is the partner ID; `trs` is the project ID the
 *                   brand programmes are connected under. `sub_id` appears in
 *                   statistics and may contain only Latin letters, digits and
 *                   "_", so our click UUID is sent with its hyphens removed.
 *   Rate limit      Partner links: 100 requests per minute per marker, at most
 *                   10 links per request. One click is one request.
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
/** A visitor is waiting on this one, so it gets far less patience. */
const PARTNER_LINK_TIMEOUT_MS = 4000;

export interface TravelpayoutsConfig {
  /** Partner ID. Without it no link can be attributed, so none is emitted. */
  marker: string;
  /** Required for partner links (any link without a template) and flight data. */
  apiToken?: string;
  /** Project ID (`trs`) the brand programmes are connected under. */
  projectId?: string;
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
    projectId: process.env.TRAVELPAYOUTS_PROJECT_ID?.trim() || undefined,
    currency: process.env.TRAVELPAYOUTS_CURRENCY?.trim() || "usd",
    locale: process.env.TRAVELPAYOUTS_LOCALE?.trim() || "en",
  };
}

/**
 * Whether an untemplated link can be turned into a tracked partner link — the
 * condition for offering anything that depends on one, such as the home
 * search tabs.
 */
export function partnerLinksReady(config: TravelpayoutsConfig | null): boolean {
  return Boolean(config?.marker && config.apiToken && config.projectId);
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
 * Our click UUID as a Travelpayouts SubID. SubIDs accept Latin letters, digits
 * and "_" only, so the hyphens go; the 32 hex digits that remain are still
 * unique and map back to the click row unambiguously.
 */
export function toSubId(clickId: string): string {
  return clickId.replace(/[^A-Za-z0-9_]/g, "");
}

/**
 * Fills a link row's template. For a brand whose tracked URL shape an editor
 * has confirmed by hand; everything else goes through the partner-links API,
 * which is the documented path.
 */
function fillTemplate(
  template: string,
  destinationUrl: string,
  config: TravelpayoutsConfig,
  input: DeepLinkInput,
): string {
  const subId = toSubId(input.clickId);
  return template
    .replaceAll("{marker}", encodeURIComponent(config.marker))
    .replaceAll("{clickId}", encodeURIComponent(subId))
    .replaceAll("{subId}", encodeURIComponent(subId))
    .replaceAll("{url}", encodeURIComponent(destinationUrl))
    .replaceAll("{campaign}", encodeURIComponent(input.campaign ?? ""));
}

/** Merges a link row's default parameters into the brand URL itself. */
function withParams(destinationUrl: string, params?: Record<string, string>): string {
  const url = new URL(destinationUrl);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Shape of a /links/v1/create response, per the published documentation. */
interface PartnerLinksResponse {
  code?: string;
  status?: number;
  error?: string;
  result?: {
    links?: { url?: string; code?: string; message?: string; partner_url?: string }[];
  };
}

async function createPartnerLink(
  brandUrl: string,
  subId: string,
  config: { marker: string; apiToken: string; projectId: string },
): Promise<Result<string>> {
  const failed = (message: string) =>
    err(
      appError("PROVIDER_ERROR", `Travelpayouts partner link failed: ${message}`, {
        publicMessage: "This offer is temporarily unavailable.",
      }),
    );

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/links/v1/create`, {
      method: "POST",
      headers: {
        "x-access-token": config.apiToken,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        // Both are numeric in the documented examples.
        trs: Number(config.projectId),
        marker: Number(config.marker),
        shorten: false,
        links: [{ url: brandUrl, sub_id: subId }],
      }),
      signal: AbortSignal.timeout(PARTNER_LINK_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    return failed(error instanceof Error ? error.message : "network error");
  }

  if (response.status === 429) {
    return err(
      appError("RATE_LIMITED", "Travelpayouts partner-link rate limit reached", {
        publicMessage: "Too many requests. Please try again shortly.",
      }),
    );
  }

  let body: PartnerLinksResponse;
  try {
    body = (await response.json()) as PartnerLinksResponse;
  } catch {
    return failed(`HTTP ${response.status} with an unreadable body`);
  }

  if (!response.ok || body.code !== "success") {
    return failed(body.error ?? `HTTP ${response.status}`);
  }

  // "trs is not subscribed for brand" and "can't create partner link" both
  // arrive with HTTP 200, so success has to be read from the link itself.
  const link = body.result?.links?.[0];
  if (link?.code !== "success" || !link.partner_url) {
    return failed(link?.message ?? "no partner_url returned");
  }

  return ok(link.partner_url);
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

      let brandUrl: string;
      try {
        brandUrl = withParams(input.destinationUrl, input.params);
      } catch {
        return err(
          appError("VALIDATION_FAILED", `Invalid destination URL: ${input.destinationUrl}`, {
            publicMessage: "This link is misconfigured.",
          }),
        );
      }

      if (input.deepLinkTemplate) {
        return ok({
          url: fillTemplate(input.deepLinkTemplate, brandUrl, config, input),
          trackingAttached: true,
        });
      }

      // Without a token and project there is no documented way to attribute
      // this click. Emitting the bare brand URL would look like a working link
      // and earn nothing, so fail visibly instead.
      if (!config.apiToken || !config.projectId) {
        return err(missingToken("partner links (with TRAVELPAYOUTS_PROJECT_ID)"));
      }

      const partnerUrl = await createPartnerLink(brandUrl, toSubId(input.clickId), {
        marker: config.marker,
        apiToken: config.apiToken,
        projectId: config.projectId,
      });
      if (!partnerUrl.ok) return partnerUrl;

      return ok({ url: partnerUrl.data, trackingAttached: true });
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
