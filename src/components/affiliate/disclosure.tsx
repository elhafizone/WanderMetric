/**
 * Affiliate disclosure.
 *
 * Legally required wherever affiliate links appear (FTC in the US, ASA/CAP in
 * the UK, and equivalents elsewhere) — not a courtesy, and not something to
 * bury in the footer alone. Rendered near the links it describes.
 */
export function AffiliateDisclosure({ className }: { className?: string }) {
  return (
    <aside
      className={`border-border bg-surface-2 text-ink-muted rounded-lg border px-4 py-3 text-sm ${className ?? ""}`}
    >
      <strong className="text-ink font-medium">Affiliate disclosure.</strong> WanderMetric
      earns commission from some links on this page. This never affects which places we
      recommend or what we say about them.
    </aside>
  );
}
