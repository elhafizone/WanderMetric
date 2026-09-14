import type { DeviceType } from "@/core/shared/db";

/**
 * Pure request classification.
 *
 * Deliberately framework-free and side-effect-free so it is trivially testable
 * and reusable by any future client. Nothing here reads or retains an IP
 * address.
 */

const BOT_PATTERN =
  /(bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|whatsapp|telegram|headless|lighthouse|gtmetrix|pingdom|curl\/|wget\/|python-requests|axios\/|node-fetch)/i;

const TABLET_PATTERN = /(ipad|tablet|playbook|silk|(android(?!.*mobile)))/i;
const MOBILE_PATTERN =
  /(android|iphone|ipod|windows phone|blackberry|opera mini|iemobile)/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // No UA at all is far more often automation than a browser.
  return BOT_PATTERN.test(userAgent);
}

export function classifyDevice(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return "unknown";
  if (BOT_PATTERN.test(userAgent)) return "bot";
  if (TABLET_PATTERN.test(userAgent)) return "tablet";
  if (MOBILE_PATTERN.test(userAgent)) return "mobile";
  return "desktop";
}

/**
 * Reduces a referrer to its hostname.
 *
 * Only the host is kept: a full referrer URL can carry search terms, session
 * identifiers and other personal data we have no need for.
 */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export interface UtmParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

export function extractUtm(params: URLSearchParams): UtmParams {
  const take = (key: string) => {
    const value = params.get(key);
    return value ? value.slice(0, 120) : null;
  };
  return {
    utm_source: take("utm_source"),
    utm_medium: take("utm_medium"),
    utm_campaign: take("utm_campaign"),
  };
}

/** Normalizes an ISO-3166 alpha-2 country code, or null when unusable. */
export function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== "XX" ? code : null;
}
