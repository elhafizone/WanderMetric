import Link from "next/link";

import { site } from "@/core/seo/site";

/**
 * Site header.
 *
 * A server component with no JavaScript: the mobile menu is a native
 * `<details>` element, which is keyboard accessible, works without JS, and
 * costs nothing in the bundle. A hamburger that needs React to open is a poor
 * trade for a travel site where most arrivals are mobile and often on patchy
 * connections.
 */

const NAV = [
  { href: "/destinations", label: "Destinations" },
  { href: "/guides", label: "Guides" },
  { href: "/hotels", label: "Hotels" },
  { href: "/activities", label: "Things to do" },
  { href: "/tours", label: "Tours" },
  { href: "/flights", label: "Flights" },
  { href: "/deals", label: "Deals" },
];

export function SiteHeader() {
  return (
    <header className="border-border bg-bg/85 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-baseline gap-1.5 font-semibold">
          <span className="text-lg tracking-tight">Wander</span>
          <span className="text-accent text-lg tracking-tight">Metric</span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-ink-muted hover:bg-surface-2 hover:text-ink rounded-md px-3 py-2 text-sm transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/search"
          className="border-border text-ink-muted hover:border-accent hover:text-accent ml-auto rounded-md border px-3 py-2 text-sm transition-colors lg:ml-0"
        >
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Search</span>
        </Link>

        <details className="relative lg:hidden">
          <summary
            aria-label="Open menu"
            className="border-border cursor-pointer list-none rounded-md border px-3 py-2 text-sm marker:content-['']"
          >
            Menu
          </summary>
          <nav
            aria-label="Mobile"
            className="border-border bg-surface absolute right-0 z-50 mt-2 w-56 rounded-lg border p-2 shadow-lg"
          >
            <ul className="flex flex-col">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:bg-surface-2 block rounded-md px-3 py-2.5 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>

      <span className="sr-only">{site.tagline}</span>
    </header>
  );
}
