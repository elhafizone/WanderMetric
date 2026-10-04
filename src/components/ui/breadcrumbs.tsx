import { ChevronRight } from "lucide-react";
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
 * site from a search engine. Each link keeps a 32px hit height.
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
      <nav aria-label="Breadcrumb" className="text-ink-muted text-sm font-semibold">
        <ol className="flex flex-wrap items-center gap-x-1.5">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 opacity-70" />
              )}
              {item.href ? (
                <Link
                  className="hover:text-accent flex min-h-8 items-center underline-offset-4 transition-colors hover:underline"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink flex min-h-8 items-center">
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
