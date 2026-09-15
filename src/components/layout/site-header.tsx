"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Site header.
 *
 * This is a client component, which is a deliberate exception on a site that is
 * otherwise entirely server-rendered. It needs two things it cannot get on the
 * server: whether the current route opens with a full-bleed hero (so the header
 * can sit *on* the photograph rather than above it), and how far the reader has
 * scrolled (so it can resolve into a solid bar). The markup is still rendered
 * on the server and the component holds no data — the cost is a few hundred
 * bytes of behaviour, not a client-side application.
 *
 * The mobile menu remains a native `<details>`: keyboard accessible, and it
 * still opens if the JavaScript never arrives. The only thing script adds is
 * closing it after a client-side navigation, which a full page load would have
 * done by itself.
 *
 * Over a hero the bar is not dark. It used to lay `from-black/45` over the
 * photograph, which dimmed the brightest, warmest part of the best image on
 * the site to buy legibility for white links. The hero photograph measures 198
 * luminance across its top fifth — bright sky — so white type was the wrong
 * choice there anyway. Instead a soft ivory veil carries charcoal navigation:
 * legible over a bright sky (effective background ~232) and still legible over
 * a dark one (~190), and it reads as the page reaching up over the image
 * rather than a shadow laid across it.
 */

const NAV = [
  { href: "/destinations", label: "Destinations" },
  { href: "/hotels", label: "Hotels" },
  { href: "/activities", label: "Things to Do" },
  { href: "/flights", label: "Flights" },
  { href: "/guides", label: "Guides" },
  { href: "/deals", label: "Deals" },
];

/** Routes whose first element is a photograph the header should sit over. */
const OVERLAY_ROUTES = new Set(["/"]);

export function SiteHeader() {
  const pathname = usePathname();
  const overlay = OVERLAY_ROUTES.has(pathname);
  const [scrolled, setScrolled] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // rAF-throttled so a fast scroll cannot queue a state update per event.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Close the mobile sheet when the route changes under it.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  const solid = scrolled || !overlay;
  // Overlaying a photograph, but never "on dark" — the veil keeps it light.
  const overlaying = overlay && !scrolled;

  return (
    <header
      className={`ease-editorial fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,padding,box-shadow] duration-300 ${
        solid
          ? "bg-bg/88 border-border border-b py-3 backdrop-blur-md"
          : "border-b border-transparent py-5"
      }`}
    >
      {/* Ivory veil under the bar while it overlays a photograph, so charcoal
          navigation stays readable whatever the image is doing underneath. */}
      {overlaying && (
        <div
          aria-hidden="true"
          className="masthead-veil pointer-events-none absolute inset-x-0 top-0 -z-10 h-32"
        />
      )}

      <div className="text-ink mx-auto flex w-full max-w-[84rem] items-center gap-6 px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="font-display shrink-0 text-[1.375rem] leading-none tracking-tight"
          style={{ fontVariationSettings: '"opsz" 40, "SOFT" 20' }}
        >
          Wander<span className="text-accent">Metric</span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-7">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`nav-link text-sm transition-opacity hover:opacity-100 ${
                      active ? "opacity-100" : "opacity-80"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          href="/search"
          className="border-border-strong hover:border-ink hover:bg-surface/70 ml-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors lg:ml-0"
        >
          <SearchIcon />
          <span className="hidden sm:inline">Search</span>
          <span className="sr-only sm:hidden">Search</span>
        </Link>

        <details ref={menu} className="lg:hidden">
          <summary
            aria-label="Open menu"
            className="border-border-strong hover:bg-surface/70 cursor-pointer list-none rounded-full border px-4 py-2 text-sm transition-colors marker:content-['']"
          >
            Menu
          </summary>
          <nav
            aria-label="Mobile"
            className="border-border bg-surface text-ink fixed inset-x-3 top-[4.5rem] z-50 rounded-xl border p-3 shadow-lg"
          >
            <ul className="flex flex-col">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:bg-surface-2 flex items-center justify-between rounded-lg px-4 py-3.5 text-[0.9375rem]"
                  >
                    {item.label}
                    <span aria-hidden="true" className="text-ink-muted">
                      →
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/tours"
                  className="hover:bg-surface-2 flex items-center justify-between rounded-lg px-4 py-3.5 text-[0.9375rem]"
                >
                  Tours
                  <span aria-hidden="true" className="text-ink-muted">
                    →
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="7" cy="7" r="4.75" />
      <path d="M10.5 10.5 14 14" strokeLinecap="round" />
    </svg>
  );
}
