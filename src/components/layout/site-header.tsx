"use client";

import { ChevronDown, Globe, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Logo } from "@/components/brand/logo";
import { SectionIcon } from "@/components/section/section-icon";
import { SECTIONS, countryHubPath, sectionPath } from "@/core/sections/sections";

/**
 * Site header.
 *
 * White, in flow and sticky, with a hairline beneath. Ten sections will not fit
 * in a row, so the primary navigation is one "Sections" menu that opens a grid of
 * all ten, beside the search link and an "All countries" menu. The destination is
 * a filter, not a section: choosing a country opens that country's offers across
 * every section.
 *
 * Both menus are native `<details>` elements: keyboard accessible, and they still
 * open if the JavaScript never arrives. Script only closes them after a
 * client-side navigation or a click outside.
 */

export interface HeaderCountry {
  name: string;
  slug: string;
  offerCount: number;
}

const FOOTER_LINKS = [{ href: "/affiliate-disclosure", label: "How we make money" }];

export function SiteHeader({ countries = [] }: { countries?: HeaderCountry[] }) {
  const pathname = usePathname();
  const sectionsMenu = useRef<HTMLDetailsElement>(null);
  const countriesMenu = useRef<HTMLDetailsElement>(null);
  const mobileMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    for (const menu of [sectionsMenu, countriesMenu, mobileMenu]) {
      if (menu.current) menu.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      for (const menu of [sectionsMenu, countriesMenu]) {
        const element = menu.current;
        if (element?.open && event.target instanceof Node && !element.contains(event.target)) {
          element.open = false;
        }
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const trigger =
    "hover:bg-bg-tint flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md px-3 text-[0.9375rem] font-semibold transition-colors marker:content-['']";

  return (
    <header className="border-border bg-surface sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-14 w-full max-w-[80rem] items-center gap-2 pr-1.5 pl-4 lg:h-[4.25rem] lg:gap-3 lg:px-10">
        <Link href="/" aria-label="WanderMetric, home" className="flex-1 lg:mr-4 lg:flex-none">
          <Logo className="h-7 w-auto lg:h-8" />
        </Link>

        <div className="hidden flex-1 items-center gap-2 lg:flex">
          <details ref={sectionsMenu} className="group">
            <summary className={`${trigger} bg-accent-soft text-ink font-extrabold`}>
              Sections
              <ChevronDown
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <nav
              aria-label="Sections"
              className="border-border bg-surface absolute inset-x-0 top-full z-50 border-b shadow-lg"
            >
              <ul className="mx-auto grid w-full max-w-[80rem] grid-cols-5 gap-2 px-10 py-5">
                {SECTIONS.map((section) => (
                  <li key={section.slug}>
                    <Link
                      href={sectionPath(section.slug)}
                      aria-current={isActive(sectionPath(section.slug)) ? "page" : undefined}
                      className={`hover:bg-bg-tint flex h-full items-start gap-3 rounded-lg p-3 transition-colors ${
                        isActive(sectionPath(section.slug)) ? "bg-accent-soft" : ""
                      }`}
                    >
                      <SectionIcon icon={section.icon} className="text-accent mt-0.5 h-5 w-5 shrink-0" />
                      <span className="text-[0.9375rem] font-extrabold">{section.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>

          <Link
            href="/search"
            className="text-ink-soft hover:bg-bg-tint border-border-strong flex min-h-11 flex-1 items-center gap-2 rounded-md border px-3 text-sm transition-colors lg:max-w-md"
          >
            <Search aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
            Search offers
          </Link>

          {countries.length > 0 && (
            <details ref={countriesMenu} className="group relative">
              <summary className={trigger}>
                <Globe aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
                All countries
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-open:rotate-180"
                />
              </summary>
              <nav
                aria-label="Countries"
                className="border-border bg-surface absolute top-full right-0 z-50 mt-1 max-h-[70svh] w-64 overflow-y-auto rounded-lg border p-2 shadow-lg"
              >
                <ul>
                  {countries.map((country) => (
                    <li key={country.slug}>
                      <Link
                        href={countryHubPath(country.slug)}
                        className="hover:bg-bg-tint flex min-h-10 items-center justify-between rounded-md px-3 text-sm font-semibold"
                      >
                        {country.name}
                        <span className="text-ink-muted tabular-nums">{country.offerCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </details>
          )}
        </div>

        <Link
          href="/search"
          aria-label="Search the site"
          className="hover:bg-bg-tint flex h-11 w-11 items-center justify-center rounded-md transition-colors lg:hidden"
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
              {SECTIONS.map((section) => (
                <li key={section.slug}>
                  <Link
                    href={sectionPath(section.slug)}
                    className={`hover:bg-bg-tint flex min-h-12 items-center gap-3 rounded-md px-3 text-base font-semibold ${
                      isActive(sectionPath(section.slug)) ? "text-accent font-extrabold" : ""
                    }`}
                  >
                    <SectionIcon icon={section.icon} className="text-accent h-5 w-5 shrink-0" />
                    {section.name}
                  </Link>
                </li>
              ))}
            </ul>
            {countries.length > 0 && (
              <div className="border-border mt-2 border-t pt-2">
                <p className="eyebrow text-ink-muted px-3 py-1.5">Countries</p>
                <ul className="flex flex-wrap gap-2 px-3 pb-2">
                  {countries.map((country) => (
                    <li key={country.slug}>
                      <Link
                        href={countryHubPath(country.slug)}
                        className="border-border-strong inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm font-semibold"
                      >
                        {country.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ul className="border-border mt-2 border-t pt-2">
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:bg-bg-tint flex min-h-12 items-center rounded-md px-3 text-base font-semibold"
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
