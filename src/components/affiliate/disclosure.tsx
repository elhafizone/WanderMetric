/**
 * Affiliate disclosure.
 *
 * Legally required wherever affiliate links appear (FTC in the US, ASA/CAP in
 * the UK, and equivalents elsewhere) — not a courtesy, and not something to
 * bury in the footer alone. Rendered near the links it describes.
 *
 * Styled as a quiet editor's note rather than a warning banner: a yellow alert
 * box would make the commercial relationship the loudest thing on the page,
 * which is the opposite of what disclosing it well looks like.
 */
export function AffiliateDisclosure({ className }: { className?: string }) {
  return (
    <aside
      className={`border-border-strong text-ink-muted border-l-2 py-1 pl-5 text-sm/[1.6] ${className ?? ""}`}
    >
      <strong className="text-ink font-medium">Affiliate disclosure.</strong> WanderMetric
      earns commission from some links on this page. It never affects which places we
      recommend, or what we say about them.
    </aside>
  );
}
