import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { SectionIcon } from "@/components/section/section-icon";
import { SECTIONS, sectionPath } from "@/core/sections/sections";

/**
 * The ten sections as an index, the way a magazine lists its contents: a name
 * in the display face, a line on what is actually inside, and how many guides
 * there are. Rows rather than tiles, so it reads as a list to scan, and so the
 * page has one section that is not a grid of cards.
 */
export function SectionIndex({ counts }: { counts: Record<string, number> }) {
  return (
    <ul className="grid gap-x-16 lg:grid-cols-2">
      {SECTIONS.map((section) => {
        const count = counts[section.slug] ?? 0;
        return (
          <li key={section.slug} className="border-border border-t">
            <Link
              href={sectionPath(section.slug)}
              className="group grid min-h-[5.5rem] grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-0.5 py-4"
            >
              <SectionIcon
                icon={section.icon}
                className="text-secondary row-span-2 h-6 w-6 self-center"
              />
              <span className="display-sm decoration-transparent group-hover:decoration-ink text-[1.375rem]/[1.2] underline decoration-1 underline-offset-[6px] transition-colors sm:text-[1.5rem]">
                {section.name}
              </span>
              <span className="text-ink-muted row-span-2 flex items-center gap-3 self-center text-[0.8125rem] font-semibold">
                {count > 0 && (
                  <span className="tabular-nums">
                    {count} {count === 1 ? "guide" : "guides"}
                  </span>
                )}
                <ArrowUpRight
                  aria-hidden="true"
                  className="card-arrow text-ink h-5 w-5 transition-transform group-hover:-translate-y-0.5"
                />
              </span>
              <span className="text-ink-muted col-start-2 text-[0.9375rem]/[1.45]">
                {section.tagline}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
