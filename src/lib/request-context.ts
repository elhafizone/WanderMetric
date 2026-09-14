import "server-only";

import { headers } from "next/headers";

import {
  classifyDevice,
  isBotUserAgent,
  normalizeCountryCode,
  referrerHost,
} from "@/core/tracking/classify";
import type { DeviceType } from "@/core/shared/db";

/**
 * Derives what we are allowed to record about a request.
 *
 * The raw IP address is read only to let the CDN-provided country header be
 * preferred, and is never returned, stored or logged. Only these coarse,
 * non-identifying attributes leave this function.
 */
export interface RequestContext {
  device: DeviceType;
  isBot: boolean;
  countryCode: string | null;
  referrerHost: string | null;
}

/** Country headers set by the CDN/edge layers this app may run behind. */
const COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-hcdn-country",
  "x-geo-country",
  "x-country-code",
];

export async function getRequestContext(): Promise<RequestContext> {
  const headerList = await headers();
  const userAgent = headerList.get("user-agent");

  let countryCode: string | null = null;
  for (const header of COUNTRY_HEADERS) {
    countryCode = normalizeCountryCode(headerList.get(header));
    if (countryCode) break;
  }

  return {
    device: classifyDevice(userAgent),
    isBot: isBotUserAgent(userAgent),
    countryCode,
    referrerHost: referrerHost(headerList.get("referer")),
  };
}
