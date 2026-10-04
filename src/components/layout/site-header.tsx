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
 * White, in flow and sticky, with a hairline beneath. After the logo: Home,
 * Destinations, Tours, Flights and Compare. Compare opens a menu of the
 * categories that can be compared, because a comparison only makes sense inside
 * one category (never a flight against an eSIM). Every other section stays
 * reachable from the home page, the footer and the sections themselves.
 *
 * The menus are native `<details>` elements: keyboard accessible, and they still
 * open if the JavaScript never arrives. Script only closes them after a
 * client-side navigation or a click outside.
 */

const LINKS = [
  { href: "/", label: "Home" },
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const compareActive = pathname === "/compare" || pathname.startsWith("/compare/");

  const itemClass = (active: boolean) =>
    `relative flex h-full items-center px-3 text-[0.9375rem] font-semibold transition-colors ${
      active ? "text-accent font-extrabold" : "text-ink-soft hover:text-accent"
    }`;
  const underline = (
    <span aria-hidden="true" className="bg-accent absolute inset-x-3 bottom-0 h-[3px] rounded-t-[3px]" />
  );

  return (
    <header className="border-border bg-surface sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-14 w-full max-w-[80rem] items-center gap-2 pr-1.5 pl-4 lg:h-[4.25rem] lg:gap-8 lg:px-10">
        <Link href="/" aria-label="WanderMetric, home" className="flex-1 lg:flex-none">
          <Logo className="h-7 w-auto lg:h-8" />
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
              className="border-border bg-surface absolute top-full left-0 z-50 mt-0 w-72 rounded-b-lg border p-2 shadow-lg"
            >
              <p className="text-ink-muted px-3 py-2 text-xs/4">
                Compare providers within one category.
              </p>
              <ul>
                {COMPARE_SECTIONS.map((section) => (
                  <li key={section.slug}>
                    <Link
                      href={comparePath(section.slug)}
                      className="hover:bg-bg-tint flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold"
                    >
                      <SectionIcon icon={section.icon} className="text-accent h-[1.125rem] w-[1.125rem] shrink-0" />
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
          aria-label="Search the site"
          className="hover:bg-bg-tint flex h-11 w-11 items-center justify-center rounded-md transition-colors"
        >
          <Search aria-hidden="true" className="h-[1.375rem] w-[1.375rem]" />
        </Link>

        <details ref={mobileMenu} className="group lg:hidden">
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
              {LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`hover:bg-bg-tint flex min-h-12 items-center rounded-md px-3 text-base font-semibold ${
                      isActive(item.href) ? "text-accent font-extrabold" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/compare"
                  className={`hover:bg-bg-tint flex min-h-12 items-center rounded-md px-3 text-base font-semibold ${
                    compareActive ? "text-accent font-extrabold" : ""
                  }`}
                >
                  Compare
                </Link>
                <ul className="mb-1 ml-3 flex flex-col border-l border-[var(--color-border)] pl-2">
                  {COMPARE_SECTIONS.map((section) => (
                    <li key={section.slug}>
                      <Link
                        href={comparePath(section.slug)}
                        className="hover:bg-bg-tint flex min-h-11 items-center gap-3 rounded-md px-3 text-[0.9375rem] font-medium"
                      >
                        <SectionIcon icon={section.icon} className="text-accent h-[1.125rem] w-[1.125rem] shrink-0" />
                        {section.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
