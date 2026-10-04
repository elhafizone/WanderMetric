import { Clock } from "lucide-react";
import Link from "next/link";

import { MediaImage } from "@/components/ui/media-image";
import type { GuideCard } from "@/core/content/types";
import { formatMonthYear, formatReadingTime } from "@/lib/format";
import { placeKeysFromSlug } from "@/core/media/imagery";
import { guidePath } from "@/lib/paths";

/**
 * A guide on a card, in two shapes: a stacked card for grids and a compact row
 * for lists on a phone.
 *
 * The overline is the guide's category, the title is set in the display face,
 * and the last line carries the two things a reader uses to decide whether to
 * trust it: how long it takes and when it was last updated.
 */
export function ArticleTile({
  guide,
  row = false,
}: {
  guide: GuideCard;
  row?: boolean;
}) {
  const reading = formatReadingTime(guide.reading_minutes);
  const updated = formatMonthYear(guide.updated_at);
  const meta = [reading, updated ? `Updated ${updated}` : null].filter(Boolean).join(" · ");

  return (
    <article
      className={`group border-border bg-surface hover:border-border-strong relative flex h-full overflow-hidden rounded-lg border transition-colors duration-150 ${
        row ? "flex-row gap-3.5 p-2.5" : "flex-col"
      }`}
    >
      <div
        className={`bg-surface-2 relative shrink-0 overflow-hidden ${
          row ? "h-24 w-24 rounded-lg" : "aspect-video w-full"
        }`}
      >
        <MediaImage
          media={guide.hero}
          label={guide.title}
          imageKeys={placeKeysFromSlug(guide.slug)}
          sizes={row ? "96px" : "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"}
        />
      </div>

      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${row ? "py-0.5" : "p-4"}`}>
        {guide.category && (
          <p className="text-secondary text-xs/4 font-extrabold tracking-[0.06em] uppercase">
            {guide.category.name}
          </p>
        )}
        <h3 className="display-sm text-[1.125rem]/6 text-pretty">
          <Link href={guidePath(guide.slug)} className="after:absolute after:inset-0">
            {guide.title}
          </Link>
        </h3>
        {meta && (
          <p className="text-ink-muted mt-auto flex items-center gap-1.5 pt-1 text-[0.8125rem]/[1.125rem] font-semibold tabular-nums">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {meta}
          </p>
        )}
      </div>
    </article>
  );
}
