import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { ContentCard } from "@/components/ui/card";
import type { MediaRef } from "@/core/content/types";

/**
 * The end of the article.
 *
 * Not "Related posts". A reader who has just finished three days in Paris wants
 * more Paris, so the rail is named after the place and mixes what actually
 * exists for it: other guides, the destination page, and the things to do we
 * hold real entries for. Everything is drawn from the guide's own relations —
 * if a guide has no city, or the city has no attractions, that strand simply
 * does not render. Nothing is padded out with an empty card.
 *
 * The onward links are internal. WanderMetric earns from partners, but the
 * sequence a reader is owed is discover, learn, explore, compare, decide — and
 * only then act. A booking button under the last paragraph of an editorial
 * piece inverts that, and there is nothing honest to point one at today in any
 * case: the only affiliate program in the database is paused and `/go/[slug]`
 * is returning 404 in production until the service-role key is configured.
 */

export interface ExploreLink {
  href: string;
  label: string;
  /** "Destination", "Things to do", "Walking tour" — what opens on click. */
  kind: string;
}

export interface RelatedStory {
  id: string;
  href: string;
  title: string;
  summary: string | null;
  media: MediaRef | null;
  imageKeys?: Array<string | null | undefined>;
  eyebrow?: string | null;
  meta?: string | null;
}

export function KeepExploring({
  place,
  stories,
  links,
}: {
  /** "Paris", or null when the guide is not tied to a place. */
  place: string | null;
  stories: RelatedStory[];
  links: ExploreLink[];
}) {
  if (stories.length === 0 && links.length === 0) return null;

  return (
    <section aria-labelledby="keep-exploring" className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <div aria-hidden="true" className="rule w-full" />
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h2 id="keep-exploring" className="display text-[1.875rem] sm:text-[2.5rem]">
            {place ? `Keep exploring ${place}` : "Keep exploring"}
          </h2>
          <Link
            href="/guides"
            className="group/all text-ink hover:text-accent inline-flex shrink-0 items-center gap-2 text-sm font-medium transition-colors"
          >
            All guides
            <span
              aria-hidden="true"
              className="ease-editorial transition-transform duration-200 group-hover/all:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </div>

      {stories.length > 0 && (
        <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <ContentCard
              key={story.id}
              href={story.href}
              title={story.title}
              summary={story.summary}
              media={story.media}
              imageKeys={story.imageKeys}
              eyebrow={story.eyebrow}
              meta={story.meta}
            />
          ))}
        </Reveal>
      )}

      {/*
       * A typographic strand, not a second row of cards. Two reasons it carries
       * no thumbnail. Visually, four tiles under three cards is the wall of
       * boxes this design is avoiding. Factually, the only photograph we hold
       * for an attraction is one of its *city*: rendering it four times beside
       * four different names would repeat the same picture down the row and
       * imply each one depicts that specific place, which is the image rule in
       * `src/core/media/imagery.ts` broken in the most visible way possible.
       */}
      {links.length > 0 && (
        <Reveal className="border-border grid border-t sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group border-border hover:bg-surface ease-editorial flex items-baseline gap-4 border-b px-1 py-4 transition-colors duration-200 sm:px-4 sm:odd:border-r"
            >
              <span className="text-ink-muted w-[6.5rem] shrink-0 text-[0.6875rem] tracking-[0.14em] uppercase">
                {link.kind}
              </span>
              <span className="display-sm text-ink min-w-0 flex-1 text-[1.0625rem]">
                {link.label}
              </span>
              <span
                aria-hidden="true"
                className="card-arrow text-accent shrink-0 text-sm"
              >
                →
              </span>
            </Link>
          ))}
        </Reveal>
      )}
    </section>
  );
}
