import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { site } from "@/core/seo/site";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumbs, rendered visibly and marked up as BreadcrumbList.
 *
 * Both matter: the markup earns the breadcrumb treatment in search results,
 * and the visible trail is what actually helps someone who landed deep in the
 * site from a search engine.
 *
 * `onMedia` switches the palette for a trail set over a photograph. The colours
 * are fixed rather than themed, because the background there is an image and
 * not the page.
 */
export function Breadcrumbs({
  items,
  onMedia = false,
}: {
  items: Crumb[];
  onMedia?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(item.href ? { item: new URL(item.href, site.url).toString() } : {}),
          })),
        }}
      />
      <nav
        aria-label="Breadcrumb"
        className={`text-xs tracking-wide ${onMedia ? "text-on-media-muted" : "text-ink-muted"}`}
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="opacity-50">
                  /
                </span>
              )}
              {item.href ? (
                <Link
                  className="underline-offset-4 transition-opacity hover:underline hover:opacity-100"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className={onMedia ? "text-on-media" : "text-ink"}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
