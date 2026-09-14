import {
  createTravelpayoutsProvider,
  travelpayoutsConfigFromEnv,
} from "@/core/affiliate/providers/travelpayouts";
import {
  getAffiliateProvider,
  registerAffiliateProvider,
} from "@/core/affiliate/registry";

/**
 * Registers every provider whose configuration is present.
 *
 * A provider with no credentials is simply not registered, so link resolution
 * fails loudly with NOT_CONFIGURED rather than silently emitting an unattributed
 * URL. Sending a visitor to a partner without attribution costs the commission
 * and looks like a working link, which is the worst of both outcomes.
 *
 * Idempotent: safe to call from every request path.
 */
let initialized = false;

export function ensureProvidersRegistered(): void {
  if (initialized) return;
  initialized = true;

  const travelpayouts = travelpayoutsConfigFromEnv();
  if (travelpayouts && !getAffiliateProvider("travelpayouts")) {
    registerAffiliateProvider(createTravelpayoutsProvider(travelpayouts));
  }
}
