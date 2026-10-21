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
 * The lead-in is the guide's category, the title is set in the display face,
 * and the last line carries the two things a reader uses to decide whether to
 * trust it: how long it takes and when it was last updated. Like every card it
 * has no frame: a soft-cornered photograph and words on the page.
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
    <article className={`group relative flex h-full ${row ? "flex-row gap-4" : "flex-col gap-4"}`}>
      <div
        className={`bg-surface-2 relative shrink-0 overflow-hidden rounded-lg ${
          row ? "h-24 w-24" : "aspect-[16/10] w-full"
        }`}
      >
        <MediaImage
          media={guide.hero}
          label={guide.title}
          imageKeys={placeKeysFromSlug(guide.slug)}
          sizes={row ? "96px" : "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"}
          className="card-media"
        />
      </div>

      <div className={`flex min-w-0 flex-1 flex-col gap-2 ${row ? "py-0.5" : ""}`}>
        {guide.category && (
          <p className="text-secondary text-[0.8125rem]/[1.125rem] font-bold">{guide.category.name}</p>
        )}
        <h3 className="display-sm text-[1.25rem]/[1.25] text-pretty">
          <Link
            href={guidePath(guide.slug)}
            className="decoration-transparent group-hover:decoration-ink underline decoration-1 underline-offset-[5px] transition-colors after:absolute after:inset-0"
          >
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
