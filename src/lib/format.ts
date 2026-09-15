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
