"use client";

import { Info, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Logo } from "@/components/brand/logo";

/**
 * Site header.
 *
 * White, in flow and sticky, with a hairline beneath: the identity's header.
 * The primary navigation is the eight things a visitor comes to do — the search
 * verticals first, then deals and guides — and the current section carries a
 * 3px Lagoon underline. "How we earn" sits on the right because a site that
 * earns commission should be easy to ask about.
 *
 * It is a client component only to know the current route, so the active item
 * can be marked. The markup is still rendered on the server and holds no data.
 * The mobile menu stays a native `<details>`: keyboard accessible, and it still
 * opens if the JavaScript never arrives. Script only closes it after a
 * client-side navigation.
 */

const NAV = [
  { href: "/flights", label: "Flights" },
  { href: "/car-hire", label: "Car hire" },
  { href: "/transfers", label: "Transfers" },
  { href: "/activities", label: "Things to do" },
  { href: "/esim", label: "eSIM" },
  { href: "/insurance", label: "Insurance" },
  { href: "/deals", label: "Deals" },
  { href: "/guides", label: "Guides" },
];

/** Reached from the menu and the footer, not the main bar. */
const MORE = [
  { href: "/destinations", label: "Destinations" },
  { href: "/hotels", label: "Hotels & stays" },
  { href: "/affiliate-disclosure", label: "How we make money" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  // Close the mobile sheet when the route changes under it.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-border bg-surface sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-14 w-full max-w-[80rem] items-center gap-2 pr-1.5 pl-4 lg:h-[4.25rem] lg:gap-8 lg:px-10">
        <Link href="/" aria-label="WanderMetric, home" className="flex-1 lg:flex-none">
          <Logo className="h-7 w-auto lg:h-8" />
        </Link>

        <nav aria-label="Main" className="hidden h-full flex-1 items-stretch gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center px-3 text-[0.9375rem] font-semibold transition-colors ${
                  active ? "text-accent font-extrabold" : "text-ink-soft hover:text-accent"
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="bg-accent absolute inset-x-3 bottom-0 h-[3px] rounded-t-[3px]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/affiliate-disclosure"
          className="text-accent hover:bg-accent-soft hidden min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors lg:flex"
        >
          <Info aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
          How we earn
        </Link>

        <Link
          href="/search"
          aria-label="Search the site"
          className="hover:bg-bg-tint flex h-11 w-11 items-center justify-center rounded-md transition-colors lg:hidden"
        >
          <Search aria-hidden="true" className="h-[1.375rem] w-[1.375rem]" />
        </Link>

        <details ref={menu} className="group lg:hidden">
          <summary
            aria-label="Menu"
            className="hover:bg-bg-tint flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md transition-colors marker:content-['']"
          >
            <Menu aria-hidden="true" className="h-6 w-6 group-open:hidden" />
            <X aria-hidden="true" className="hidden h-6 w-6 group-open:block" />
          </summary>
          <nav
            aria-label="Mobile"
            className="border-border bg-surface fixed inset-x-0 top-14 z-50 max-h-[calc(100svh-3.5rem)] overflow-y-auto border-b p-3 shadow-lg"
          >
            <ul className="flex flex-col">
              {[...NAV, ...MORE].map((item, index) => (
                <li
                  key={item.href}
                  className={index === NAV.length ? "border-border mt-2 border-t pt-2" : ""}
                >
                  <Link
                    href={item.href}
                    className={`hover:bg-bg-tint flex min-h-12 items-center justify-between rounded-md px-3 text-base font-semibold ${
                      isActive(item.href) ? "text-accent font-extrabold" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
