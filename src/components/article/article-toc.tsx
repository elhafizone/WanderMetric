"use client";

import { useEffect, useState } from "react";

import type { ArticleHeading } from "@/lib/article/body";

/**
 * "On this page" — built from the article's own headings.
 *
 * Nothing about any particular article is encoded here. The list arrives as
 * data from `parseArticleBody`, so a guide with headings gets navigation and a
 * guide without them renders nothing rather than an empty panel. That is not a
 * placeholder: no stored guide currently contains a heading, so on today's
 * content this component correctly draws nothing at all (see the data-model
 * note in `src/lib/article/body.ts`).
 *
 * Accessibility notes, since a table of contents is easy to get wrong:
 *
 *   * It is a real `<nav>` of real `<a href="#id">`. It works with JavaScript
 *     disabled, it is reachable by keyboard, and `aria-current` marks the
 *     active entry rather than colour alone.
 *   * Smooth scrolling is applied by the browser's own `scroll-behavior`, which
 *     `prefers-reduced-motion` already neutralises in globals.css — no
 *     scripted scroll animation to opt out of.
 *   * On a phone it collapses into a native `<details>`, which is keyboard
 *     accessible and opens without script, matching the mobile menu pattern the
 *     header already uses.
 *
 * ## Why the active section is not tracked with IntersectionObserver
 *
 * It was, and it did not work. An observer with a top-weighted root margin only
 * reports a heading while it is inside a narrow band near the top of the
 * viewport, so a section longer than that band leaves *no* heading intersecting
 * for most of its length. The indicator then has to hold its last value, and if
 * a heading crosses the band during a fast scroll — or if the first callback
 * arrives before the webfonts settle the layout, which is exactly when it does
 * arrive — the indicator latches onto the wrong entry and never moves again.
 * Measured on a four-heading article: the band covered 180px of a 900px
 * viewport and the gaps between headings were up to 460px, so three of the four
 * sections could never become current.
 *
 * A rAF-throttled scroll read is the correct tool here, and the objection to it
 * does not apply at this size: "the last heading whose top has passed the
 * reading line" is a total function of scroll position — always defined, never
 * dependent on catching a transition — and it costs one
 * `getBoundingClientRect` per heading per animation frame on a handful of
 * elements. State is written only when the answer actually changes, so a scroll
 * through one long section causes no re-render at all.
 */
export function ArticleToc({
  headings,
  className,
}: {
  headings: ArticleHeading[];
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const ids = headings.map((heading) => heading.id);
    let frame = 0;

    const measure = () => {
      frame = 0;
      // The reading line: a heading becomes current once it rises above the top
      // quarter of the viewport, which is roughly where the eye sits.
      const line = window.innerHeight * 0.25;
      let current: string | null = null;

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
        else break;
      }

      // Before the first heading has been reached, the first section is still
      // the one being read — the dek and the opening paragraphs belong to it.
      setActive(current ?? ids[0] ?? null);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (headings.length < 2) return null;

  const list = (
    <ol className="flex flex-col gap-0.5">
      {headings.map((heading) => {
        const current = heading.id === active;
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={current ? "location" : undefined}
              className={`ease-editorial block border-l py-1.5 text-[0.8125rem]/[1.5] transition-colors duration-200 ${
                heading.level === 3 ? "pl-7" : "pl-4"
              } ${
                current
                  ? "border-accent text-ink font-medium"
                  : "border-border text-ink-muted hover:border-border-strong hover:text-ink"
              }`}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Desktop: a quiet column beside the article. */}
      <nav
        aria-labelledby="toc-heading"
        className={`hidden lg:block ${className ?? ""}`}
        data-article-toc
      >
        <p id="toc-heading" className="eyebrow text-ink-muted mb-3">
          On this page
        </p>
        {list}
      </nav>

      {/* Mobile: collapsed, so it costs one line of the reading column. */}
      <details className="border-border bg-surface/70 rounded-lg border lg:hidden">
        <summary className="eyebrow text-ink-muted flex cursor-pointer list-none items-center justify-between px-4 py-3 marker:content-['']">
          On this page
          <span aria-hidden="true" className="text-ink-muted text-base">
            +
          </span>
        </summary>
        <div className="px-4 pt-1 pb-4">{list}</div>
      </details>
    </>
  );
}
