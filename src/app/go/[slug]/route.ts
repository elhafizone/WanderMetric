import { type NextRequest, NextResponse } from "next/server";

import { ensureProvidersRegistered } from "@/core/affiliate/bootstrap";
import { getAffiliateProvider } from "@/core/affiliate/registry";
import { extractUtm } from "@/core/tracking/classify";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestContext } from "@/lib/request-context";
import { ensureSessionId } from "@/lib/tracking/session";
import { logError, logWarn } from "@/lib/logger";

/**
 * Affiliate redirector.
 *
 * A server-side 302, never a client-side bounce: search engines understand it,
 * it costs no JavaScript, and it works with JS disabled. The route is
 * Disallowed in robots.txt and returns `x-robots-tag: noindex` so no crawler
 * treats an outbound link as indexable content.
 *
 * Design notes:
 *  - `slug` is the only thing a visitor controls. The destination always comes
 *    from the database, so there is no `?url=` to abuse — an open redirect is
 *    structurally impossible here.
 *  - The click is recorded BEFORE redirecting, because a lost click is lost
 *    revenue attribution. If recording fails we still redirect: sending the
 *    visitor where they asked matters more than our analytics.
 *  - The response is explicitly uncacheable. A cached affiliate redirect would
 *    collapse every visitor's click onto one click_id.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The generated RPC signatures model optional arguments as `string | undefined`,
 * while every source of these values yields `string | null`. One conversion
 * point beats a null-coalesce on each of eight arguments.
 */
function orUndefined(value: string | null): string | undefined {
  return value ?? undefined;
}

/**
 * A real 404, not a redirect to a /404 path (which is not a route in the App
 * Router). An unresolvable affiliate slug is genuinely not found, and saying so
 * with the correct status keeps crawlers and monitoring honest.
 */
function notFound() {
  return new NextResponse("Not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return notFound();
  }

  ensureProvidersRegistered();

  let db;
  try {
    db = createSupabaseAdminClient();
  } catch (error) {
    // Missing service-role key is a deployment fault, not a visitor's problem.
    logError("go.redirect.config", error, { slug });
    return notFound();
  }

  const { data, error } = await db.rpc("resolve_affiliate_link", { p_slug: slug });
  if (error) {
    logError("go.redirect.resolve", error, { slug });
    return notFound();
  }

  const link = data?.[0];
  if (!link) return notFound();

  const provider = getAffiliateProvider(link.provider_slug);
  if (!provider) {
    // The link exists but its provider has no credentials configured. Redirect
    // without attribution would earn nothing while looking like it worked, so
    // fail visibly instead.
    logWarn("go.redirect.provider_unconfigured", "No registered provider for link", {
      slug,
      provider: link.provider_slug,
    });
    return notFound();
  }

  const requestContext = await getRequestContext();
  const params = request.nextUrl.searchParams;
  const utm = extractUtm(params);

  // Bots get a redirect but no click row: counting crawlers as clicks would
  // corrupt every conversion rate on the dashboard.
  let clickId: string | null = null;
  const sessionId = requestContext.isBot ? null : await ensureSessionId();

  if (!requestContext.isBot) {
    const recorded = await db.rpc("record_affiliate_click", {
      p_link_id: link.link_id,
      p_session_id: sessionId ?? undefined,
      p_content_type: (params.get("ct") as never) ?? null,
      p_content_id: orUndefined(params.get("cid")),
      p_page_path: orUndefined(params.get("from")),
      p_referrer_host: orUndefined(requestContext.referrerHost),
      p_utm_source: orUndefined(utm.utm_source),
      p_utm_medium: orUndefined(utm.utm_medium),
      p_utm_campaign: orUndefined(utm.utm_campaign),
      p_campaign: orUndefined(params.get("c")),
      p_country_code: orUndefined(requestContext.countryCode),
      p_device: requestContext.device,
      p_is_bot: false,
    });

    if (recorded.error) {
      logError("go.redirect.record_click", recorded.error, { slug });
    } else {
      clickId = recorded.data;
    }
  }

  const deepLink = await provider.buildDeepLink({
    destinationUrl: link.destination_url,
    deepLinkTemplate: link.deep_link_template,
    // Fall back to a throwaway id so a failed insert still produces a valid,
    // attributed outbound link rather than an unattributed one.
    clickId: clickId ?? crypto.randomUUID(),
    campaign: params.get("c") ?? undefined,
    params: (link.default_params as Record<string, string>) ?? undefined,
  });

  if (!deepLink.ok) {
    logError("go.redirect.build_link", deepLink.error.message, { slug });
    return notFound();
  }

  return NextResponse.redirect(deepLink.data.url, {
    status: 302,
    headers: {
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store, no-cache, must-revalidate",
      "referrer-policy": "no-referrer-when-downgrade",
    },
  });
}
