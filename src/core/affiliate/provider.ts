import type { Vertical as DbVertical } from "@/core/shared/db";
import type { Result } from "@/core/shared/result";

/**
 * Affiliate provider contract.
 *
 * Every network — Travelpayouts, Viator, GetYourGuide, a direct program — is an
 * adapter behind this interface. Application code never imports a provider
 * directly; it resolves one from the registry by slug. Adding or removing a
 * network is an adapter file plus a database row, never a frontend change.
 *
 * Implemented: Travelpayouts (see ./providers/travelpayouts.ts). Any further
 * adapter must likewise be written against that provider's live documentation --
 * no endpoint is ever written from memory.
 */

/**
 * Mirrors the `vertical` enum in the database. Re-exported rather than
 * hand-written a second time so the two cannot silently drift apart.
 */
export type Vertical = DbVertical;

export interface ProviderCapabilities {
  /** Can build a deep link to a specific product or search result. */
  deepLinks: boolean;
  /** Exposes a searchable product catalogue. */
  search: boolean;
  /** Exposes a pull API for conversions/statistics. */
  conversionFeed: boolean;
  /** Pushes conversions to us via webhook. */
  conversionWebhook: boolean;
  /** Accepts a partner-supplied click identifier we can reconcile against. */
  subIdTracking: boolean;
}

export interface DeepLinkInput {
  /** Provider-specific target, resolved from `affiliate_links` in the database. */
  destinationUrl: string;
  /**
   * Optional brand-specific URL shape from the link row. Lets an editor express
   * an unusual deep-link format without requiring a code change.
   */
  deepLinkTemplate?: string | null;
  /** Our own click UUID, forwarded as the provider's sub-id where supported. */
  clickId: string;
  /** Optional campaign/source attribution. */
  campaign?: string;
  /** Extra provider-specific parameters, validated by the adapter. */
  params?: Record<string, string>;
}

export interface DeepLinkResult {
  url: string;
  /** True when `clickId` was actually attached and attribution is reconcilable. */
  trackingAttached: boolean;
}

export interface SearchQuery {
  vertical: Vertical;
  /** Free-text or destination slug; adapters map this to their own parameters. */
  query: string;
  limit?: number;
  locale?: string;
  currency?: string;
}

export interface ProviderOffer {
  externalId: string;
  title: string;
  url: string;
  price?: { amount: number; currency: string };
  imageUrl?: string;
  rating?: number;
  raw: unknown;
}

export interface ProviderConversion {
  externalId: string;
  clickId: string | null;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
  occurredAt: string;
  raw: unknown;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AffiliateProvider {
  readonly slug: string;
  readonly displayName: string;
  readonly verticals: readonly Vertical[];
  readonly capabilities: ProviderCapabilities;

  /** Required. Every provider must at minimum produce a trackable outbound URL. */
  buildDeepLink(input: DeepLinkInput): Promise<Result<DeepLinkResult>>;

  /** Optional — only when `capabilities.search` is true. */
  search?(query: SearchQuery): Promise<Result<ProviderOffer[]>>;

  /** Optional — only when `capabilities.conversionFeed` is true. */
  fetchConversions?(range: DateRange): Promise<Result<ProviderConversion[]>>;

  /** Optional — only when `capabilities.conversionWebhook` is true. */
  verifyWebhook?(payload: string, signature: string): Promise<boolean>;
}
