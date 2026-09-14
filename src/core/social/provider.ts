import type { Result } from "@/core/shared/result";

/**
 * Social publishing contract.
 *
 * Official platform APIs only — no browser automation, no scraping, no fake
 * engagement, no credential collection.
 *
 * Pinterest's developer policy forbids apps that let users auto-initiate actions
 * without considering each one, so the queue this interface serves is explicitly
 * human-in-the-loop: a post reaches `approved` only through an admin decision.
 *
 * NOTE: no platform is implemented yet. See Phase 8 in docs/roadmap.md.
 */

export type SocialPlatform = "pinterest" | "instagram" | "facebook" | "x";

export type SocialPostStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export interface SocialCapabilities {
  /** Supports posting to a named target (a Pinterest board, a Page). */
  targets: boolean;
  /** Requires an image. */
  requiresMedia: boolean;
  /** Supports an outbound destination link on the post. */
  destinationLink: boolean;
  /** Platform-side scheduling, as opposed to our own queue. */
  nativeScheduling: boolean;
}

export interface SocialAccountRef {
  id: string;
  platform: SocialPlatform;
  externalAccountId: string;
}

export interface SocialTarget {
  externalId: string;
  name: string;
}

export interface SocialPostDraft {
  accountId: string;
  targetExternalId?: string;
  title: string;
  description: string;
  destinationUrl: string;
  mediaUrl?: string;
}

export interface PublishResult {
  externalPostId: string;
  publishedAt: string;
}

export interface SocialProvider {
  readonly platform: SocialPlatform;
  readonly capabilities: SocialCapabilities;

  /** Exchange an OAuth authorization code for stored credentials. */
  connect(code: string, redirectUri: string): Promise<Result<SocialAccountRef>>;

  refreshToken(account: SocialAccountRef): Promise<Result<SocialAccountRef>>;

  listTargets(account: SocialAccountRef): Promise<Result<SocialTarget[]>>;

  publish(post: SocialPostDraft): Promise<Result<PublishResult>>;
}
