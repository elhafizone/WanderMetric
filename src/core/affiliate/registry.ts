import type { AffiliateProvider } from "@/core/affiliate/provider";

/**
 * Provider registry. Adapters register themselves here and the rest of the
 * application resolves them by slug only.
 *
 * Empty until Phase 6 — by design. See docs/roadmap.md.
 */
const providers = new Map<string, AffiliateProvider>();

export function registerAffiliateProvider(provider: AffiliateProvider): void {
  if (providers.has(provider.slug)) {
    throw new Error(`Affiliate provider "${provider.slug}" is already registered.`);
  }
  providers.set(provider.slug, provider);
}

export function getAffiliateProvider(slug: string): AffiliateProvider | undefined {
  return providers.get(slug);
}

export function listAffiliateProviders(): AffiliateProvider[] {
  return [...providers.values()];
}
