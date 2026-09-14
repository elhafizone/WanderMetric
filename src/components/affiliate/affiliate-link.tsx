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
 */
export function AffiliateLink({
  linkSlug,
  children,
  contentType,
  contentId,
  campaign,
  fromPath,
  className,
}: {
  linkSlug: string;
  children: React.ReactNode;
  contentType?: ContentTypeName;
  contentId?: string;
  campaign?: string;
  fromPath?: string;
  className?: string;
}) {
  const params = new URLSearchParams();
  if (contentType) params.set("ct", contentType);
  if (contentId) params.set("cid", contentId);
  if (campaign) params.set("c", campaign);
  if (fromPath) params.set("from", fromPath);

  const query = params.toString();
  const href = `${routes.affiliateRedirect(linkSlug)}${query ? `?${query}` : ""}`;

  return (
    <a
      href={href}
      rel="sponsored nofollow noopener"
      target="_blank"
      className={
        className ??
        "bg-accent text-accent-contrast inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
      }
    >
      {children}
      <span aria-hidden="true">→</span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
