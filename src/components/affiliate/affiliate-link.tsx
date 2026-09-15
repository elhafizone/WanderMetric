import { routes } from "@/core/seo/site";
import type { ContentTypeName } from "@/core/shared/db";

/**
 * The only way an outbound partner link is rendered.
 *
 * Nothing here knows the destination. The href always points at our own
 * /go/[slug] redirector, which resolves the real URL server-side from the
 * database — so no affiliate URL, marker or partner parameter ever appears in
 * the page source, and swapping providers never touches a component.
 *
 * rel="sponsored nofollow noopener" is required: `sponsored` is Google's
 * declared attribute for paid links, and omitting it is a policy problem, not a
 * stylistic one.
 *
 * The default treatment is deliberately the *secondary* button, not the primary
 * one. On a page about a place, the loudest control should be the one that
 * takes the reader further into the writing; the commercial link earns its
 * click by being there when they are ready, not by shouting. `emphasis="high"`
 * exists for the one surface where checking options genuinely is the next step
 * — a deal page the reader arrived on for that reason.
 */
export function AffiliateLink({
  linkSlug,
  children,
  contentType,
  contentId,
  campaign,
  fromPath,
  emphasis = "standard",
  className,
}: {
  linkSlug: string;
  children: React.ReactNode;
  contentType?: ContentTypeName;
  contentId?: string;
  campaign?: string;
  fromPath?: string;
  emphasis?: "standard" | "high";
  className?: string;
}) {
  const params = new URLSearchParams();
  if (contentType) params.set("ct", contentType);
  if (contentId) params.set("cid", contentId);
  if (campaign) params.set("c", campaign);
  if (fromPath) params.set("from", fromPath);

  const query = params.toString();
  const href = `${routes.affiliateRedirect(linkSlug)}${query ? `?${query}` : ""}`;

  const treatment =
    emphasis === "high"
      ? "bg-accent text-accent-contrast hover:bg-accent-hover shadow-sm hover:shadow-md"
      : "border-border-strong text-ink bg-surface hover:border-ink hover:bg-surface-2 border";

  return (
    <a
      href={href}
      rel="sponsored nofollow noopener"
      target="_blank"
      className={
        className ??
        `group/out ease-editorial inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 ${treatment}`
      }
    >
      {children}
      <span
        aria-hidden="true"
        className="ease-editorial transition-transform duration-200 group-hover/out:translate-x-0.5"
      >
        ↗
      </span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
