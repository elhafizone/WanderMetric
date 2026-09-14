import type { NextRequest } from "next/server";

import { appError } from "@/core/shared/result";
import { apiError, apiSuccess } from "@/lib/api/response";
import { validationError, withErrorHandling } from "@/lib/api/handler";
import { subscribeBody } from "@/lib/api/schemas";
import { logError, logInfo } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestContext } from "@/lib/request-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Newsletter subscription.
 *
 * Double opt-in: the row is created as `pending` and only becomes `subscribed`
 * once the confirmation token is redeemed. No email is sent yet — no ESP
 * credentials exist — so a pending row simply waits. That is deliberate: a
 * subscriber captured without confirmation is not a subscriber, and sending
 * from an unverified domain would poison deliverability from day one.
 *
 * The response is identical whether the address is new, already pending, or
 * already subscribed. Distinguishing them would turn this endpoint into an
 * oracle for testing whether a given address is on the list.
 */

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext();

  // Coarse key: no IP is stored, so this buckets by country + device rather
  // than by individual. Enough to blunt a naive script; see docs/security.md.
  const limitKey = `subscribe:${context.countryCode ?? "xx"}:${context.device}`;
  if (!rateLimit(limitKey, RATE_LIMIT, RATE_WINDOW_MS).allowed) {
    return apiError(
      appError("RATE_LIMITED", "Subscribe rate limit exceeded", {
        publicMessage: "Too many requests. Please try again in a minute.",
      }),
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError(
      appError("VALIDATION_FAILED", "Body is not valid JSON", {
        publicMessage: "Invalid request.",
      }),
    );
  }

  const parsed = subscribeBody.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  const { email, source } = parsed.data;

  let db;
  try {
    db = createSupabaseAdminClient();
  } catch (error) {
    logError("api.v1.subscribe.config", error);
    return apiError(
      appError("NOT_CONFIGURED", "Supabase service role not configured", {
        publicMessage: "Subscriptions are temporarily unavailable.",
      }),
    );
  }

  const { error } = await db
    .from("email_subscribers")
    .insert({
      email,
      source: source ?? "website",
      country_code: context.countryCode,
      status: "pending",
    })
    .select("id")
    .single();

  // 23505 means the address is already on the list. Treated as success so the
  // endpoint cannot be used to enumerate subscribers.
  if (error && error.code !== "23505") {
    logError("api.v1.subscribe.insert", error);
    return apiError(
      appError("INTERNAL", "Failed to record subscriber", {
        publicMessage: "Something went wrong. Please try again.",
      }),
    );
  }

  logInfo("api.v1.subscribe", "Subscription recorded", { source: source ?? "website" });

  return apiSuccess(
    {
      status: "pending",
      message: "Thanks — please check your inbox to confirm your subscription.",
    },
    { status: 202 },
  );
}, "api.v1.subscribe");
