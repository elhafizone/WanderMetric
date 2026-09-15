import Link from "next/link";

import { ContentCard } from "@/components/ui/card";
import { MediaImage } from "@/components/ui/media-image";
import type { GuideCard } from "@/core/content/types";
import { placeKeysFromSlug } from "@/core/media/imagery";
import { formatDate, formatReadingTime } from "@/lib/format";
import { guidePath } from "@/lib/paths";

/**
 * Magazine treatment for the guides section.
 *
 * One story is given the cover: a wide image beside a large headline, an
 * excerpt long enough to be worth reading, and its byline metadata. Everything
 * after it drops to the standard card, which is what makes the first one read
 * as a feature rather than as the first tile in a grid.
 */
export function GuideShowcase({ guides }: { guides: GuideCard[] }) {
  const [feature, ...rest] = guides;
  if (!feature) return null;

  return (
    <div className="flex flex-col gap-10">
      <article className="group border-border bg-surface relative grid overflow-hidden rounded-xl border lg:grid-cols-[1.15fr_1fr]">
        <div className="bg-surface-2 relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[24rem]">
          <MediaImage
            media={feature.hero}
            label={feature.title}
            imageKeys={placeKeysFromSlug(feature.slug)}
            sizes="(max-width: 1024px) 92vw, 48vw"
            className="card-media"
          />
        </div>

        <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
          <p className="eyebrow text-accent">
            {feature.category?.name ?? "Featured guide"}
          </p>
          <h3 className="display text-[1.75rem] sm:text-[2.375rem]">
            <Link href={guidePath(feature.slug)} className="after:absolute after:inset-0">
              {feature.title}
            </Link>
          </h3>
          {feature.excerpt && (
            <p className="text-ink-muted max-w-[46ch] text-base/[1.7]">
              {feature.excerpt}
            </p>
          )}
          <div className="text-ink-muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tracking-wide">
            {feature.published_at && (
              <time dateTime={feature.published_at}>
                {formatDate(feature.published_at)}
              </time>
            )}
            {feature.reading_minutes && (
              <span>{formatReadingTime(feature.reading_minutes)}</span>
            )}
          </div>
        </div>
      </article>

      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.map((guide) => (
            <ContentCard
              key={guide.id}
              href={guidePath(guide.slug)}
              title={guide.title}
              summary={guide.excerpt}
              media={guide.hero}
              imageKeys={placeKeysFromSlug(guide.slug)}
              eyebrow={guide.category?.name}
              meta={formatReadingTime(guide.reading_minutes)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
