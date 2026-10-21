"use client";

import { ChevronDown, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Logo } from "@/components/brand/logo";
import { SectionIcon } from "@/components/section/section-icon";
import { COMPARE_SECTIONS, comparePath } from "@/core/sections/sections";

/**
 * Site header.
 *
 * Paper-coloured, in flow and sticky, with a hairline beneath. After the logo:
 * Destinations, Tours, Flights and Compare, then one Marigold action that
 * leads to search. Compare opens a menu of the categories that can be compared,
 * because a comparison only makes sense inside one category (never a flight
 * against an eSIM). Every other section stays reachable from the home page, the
 * footer and the sections themselves.
 *
 * On a phone the menu is a full sheet of large serif links rather than the
 * desktop bar shrunk down.
 *
 * The menus are native `<details>` elements: keyboard accessible, and they still
 * open if the JavaScript never arrives. Script only closes them after a
 * client-side navigation or a click outside.
 */

const LINKS = [
  { href: "/countries", label: "Destinations" },
  { href: "/tours-activities", label: "Tours" },
  { href: "/flights", label: "Flights" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const compareMenu = useRef<HTMLDetailsElement>(null);
  const mobileMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    for (const menu of [compareMenu, mobileMenu]) {
      if (menu.current) menu.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const element = compareMenu.current;
      if (element?.open && event.target instanceof Node && !element.contains(event.target)) {
        element.open = false;
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const compareActive = pathname === "/compare" || pathname.startsWith("/compare/");

  const itemClass = (active: boolean) =>
    `relative flex h-full items-center px-3.5 text-[0.9375rem] font-semibold transition-colors ${
      active ? "text-ink" : "text-ink-soft hover:text-ink"
    }`;
  const underline = (
    <span aria-hidden="true" className="bg-accent absolute inset-x-3.5 bottom-3 h-0.5 rounded-full" />
  );

  return (
    <header className="border-border bg-bg sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center gap-2 pr-2 pl-4 lg:h-[4.75rem] lg:gap-8 lg:px-10">
        <Link href="/" aria-label="WanderMetric, home" className="flex-1 lg:flex-none">
          <Logo className="h-8 w-auto lg:h-9" />
        </Link>

        <nav aria-label="Main" className="hidden h-full flex-1 items-stretch gap-0.5 lg:flex">
          {LINKS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={itemClass(active)}
              >
                {item.label}
                {active && underline}
              </Link>
            );
          })}

          <details ref={compareMenu} className="group relative flex h-full">
            <summary
              className={`${itemClass(compareActive)} cursor-pointer list-none gap-1.5 marker:content-['']`}
            >
              Compare
              <ChevronDown
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-open:rotate-180"
              />
              {compareActive && underline}
            </summary>
            <nav
              aria-label="Compare by category"
              className="border-border bg-surface absolute top-[calc(100%-0.5rem)] left-0 z-50 w-80 rounded-xl border p-2 shadow-lg"
            >
              <p className="text-ink-muted px-3 py-2 text-[0.8125rem]/[1.25rem]">
                Compare providers within one category.
              </p>
              <ul>
                {COMPARE_SECTIONS.map((section) => (
                  <li key={section.slug}>
                    <Link
                      href={comparePath(section.slug)}
                      className="hover:bg-bg-tint flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold"
                    >
                      <SectionIcon icon={section.icon} className="text-secondary h-[1.125rem] w-[1.125rem] shrink-0" />
                      {section.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </nav>

        <Link
          href="/search"
          className="bg-cta text-on-cta hover:bg-cta-hover ease-editorial hidden min-h-11 items-center gap-2 rounded-full px-5 text-[0.9375rem] font-bold shadow-sm transition-colors lg:inline-flex"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          Search guides
        </Link>

        <Link
          href="/search"
          aria-label="Search the site"
          className="hover:bg-bg-tint flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden"
        >
          <Search aria-hidden="true" className="h-[1.375rem] w-[1.375rem]" />
        </Link>

        <details ref={mobileMenu} className="group lg:hidden">
          <summary
            aria-label="Menu"
            className="hover:bg-bg-tint flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full transition-colors marker:content-['']"
          >
            <Menu aria-hidden="true" className="h-6 w-6 group-open:hidden" />
            <X aria-hidden="true" className="hidden h-6 w-6 group-open:block" />
          </summary>
          <nav
            aria-label="Mobile"
            className="border-border bg-bg fixed inset-x-0 top-16 z-50 max-h-[calc(100svh-4rem)] overflow-y-auto border-b px-5 pt-2 pb-6 shadow-lg"
          >
            <ul className="flex flex-col">
              {LINKS.map((item) => (
                <li key={item.href} className="border-border border-b">
                  <Link
                    href={item.href}
                    className={`display flex min-h-16 items-center justify-between text-[1.625rem] ${
                      isActive(item.href) ? "text-accent" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="border-border border-b pb-3">
                <Link
                  href="/compare"
                  className={`display flex min-h-16 items-center text-[1.625rem] ${
                    compareActive ? "text-accent" : ""
                  }`}
                >
                  Compare
                </Link>
                <ul className="grid grid-cols-2 gap-x-3">
                  {COMPARE_SECTIONS.map((section) => (
                    <li key={section.slug}>
                      <Link
                        href={comparePath(section.slug)}
                        className="text-ink-soft hover:text-ink flex min-h-11 items-center gap-2.5 text-[0.9375rem] font-medium"
                      >
                        <SectionIcon icon={section.icon} className="text-secondary h-[1.125rem] w-[1.125rem] shrink-0" />
                        {section.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <Link
              href="/search"
              className="bg-cta text-on-cta hover:bg-cta-hover mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-bold"
            >
              <Search aria-hidden="true" className="h-4 w-4" />
              Search guides
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
