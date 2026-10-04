/**
 * Display formatting shared by every listing.
 *
 * Centralised because the same value appearing as "About 1 hours" on one card
 * and "1 hr" on another is the kind of detail that makes a site feel
 * machine-generated.
 */

/** "About 2 hours", "About an hour", "About 45 minutes". Null stays null. */
export function formatDuration(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `About ${minutes} minutes`;

  const hours = Math.round(minutes / 60);
  if (hours === 1) return "About an hour";
  return `About ${hours} hours`;
}

/** Long-form date, e.g. "14 March 2026". */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Short date for ephemeral things, e.g. "Ends 14 March". */
export function formatShortDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

/** "8 min read", or null when the record has no estimate. */
export function formatReadingTime(minutes: number | null | undefined): string | null {
  return minutes ? `${minutes} min read` : null;
}

/** "Sep 2026" — month and year, for "Updated" stamps. */
export function formatMonthYear(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * How soon a deal ends, in words a reader can act on: "Ends today",
 * "Ends tomorrow", "Ends in 3 days", or the date once it is further out.
 *
 * `urgent` is true inside 48 hours; that is when the deal badge goes from a
 * calm tint to full weight. Returns null for a deal with no end date, and for
 * one already over (which the database stops serving anyway).
 */
export function dealEnds(
  endsAt: string | null | undefined,
  now: Date = new Date(),
): { label: string; urgent: boolean } | null {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  const hours = (end.getTime() - now.getTime()) / 3_600_000;
  if (hours <= 0) return null;

  const days = Math.ceil(hours / 24);
  if (hours <= 24) return { label: "Ends today", urgent: true };
  if (hours <= 48) return { label: "Ends tomorrow", urgent: true };
  if (days <= 6) return { label: `Ends in ${days} days`, urgent: false };
  return {
    label: `Ends ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    urgent: false,
  };
}
