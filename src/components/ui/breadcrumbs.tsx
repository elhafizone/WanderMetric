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
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
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
      <nav aria-label="Breadcrumb" className="text-ink-muted text-sm">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-border">
                  /
                </span>
              )}
              {item.href ? (
                <Link className="hover:text-accent hover:underline" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
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
