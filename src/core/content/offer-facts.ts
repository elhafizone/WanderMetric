/**
 * Turns the `facts` object stored on an offer guide into display rows.
 *
 * Framework-free. Facts are whatever the partner listing stated, so the shape is
 * open: this module only decides how to label and flatten them. Nothing is
 * invented here, an absent key simply produces no row.
 */

export interface FactRow {
  /** The facts key, so the UI can pick an icon without parsing the label. */
  key: string;
  label: string;
  value: string;
}

export interface OfferOption {
  name: string;
  detail: string;
}

/** Keys that are shown as their own section, not as a row. */
const SECTION_KEYS = new Set(["options", "unclear_on_listing", "images", "image_credit", "rating", "included", "included_listed", "not_included"]);

const LABELS: Record<string, string> = {
  departs_from: "Departs from",
  duration: "Duration",
  duration_minutes: "Duration",
  suggested_duration: "Suggested duration",
  guide_language: "Guide language",
  group_size: "Group size",
  format: "Format",
  schedule: "Schedule",
  departures: "Departures",
  pick_up: "Pick-up",
  drop_off: "Drop-off",
  meeting_point: "Meeting point",
  time_at_site: "Time at the site",
  transport: "Transport",
  included: "Included",
  included_listed: "Included",
  not_included: "Not included",
  cancellation: "Cancellation",
  confirmation: "Confirmation",
  voucher: "Voucher",
  validity: "Validity",
  eligibility: "Eligibility",
  physical_note: "Physical demands",
  late_policy: "Late arrival",
  checkout_requirement: "At checkout",
  operator: "Operator",
  location: "Location",
  duration_note: "Duration note",
  arrive_before_minutes: "Arrive early by",
};

function humanise(key: string): string {
  const words = key.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (key === "duration_minutes" && typeof value === "number") {
    const hours = value / 60;
    return Number.isInteger(hours) ? `${hours} hours` : `${value} minutes`;
  }
  if (key === "arrive_before_minutes" && typeof value === "number") return `${value} minutes`;
  if (Array.isArray(value)) {
    const parts = value.filter((v): v is string => typeof v === "string" && v.length > 0);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  if (typeof value === "string" || typeof value === "number") return String(value);
  return null;
}

export function factRows(facts: Record<string, unknown> | null | undefined): FactRow[] {
  if (!facts) return [];
  const rows: FactRow[] = [];
  for (const [key, value] of Object.entries(facts)) {
    if (SECTION_KEYS.has(key)) continue;
    const text = formatValue(key, value);
    if (text) rows.push({ key, label: LABELS[key] ?? humanise(key), value: text });
  }
  return rows;
}

/** A caution the listing itself leaves open, shown to the reader before booking. */
export function factsCaution(facts: Record<string, unknown> | null | undefined): string | null {
  const value = facts?.unclear_on_listing;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function offerOptions(facts: Record<string, unknown> | null | undefined): OfferOption[] {
  const raw = facts?.options;
  if (!Array.isArray(raw)) return [];
  const options: OfferOption[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : null;
    if (!name) continue;
    const detail = [record.format, record.cancellation]
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .join(". ");
    options.push({ name, detail });
  }
  return options;
}

/** "4 October 2026" for the "read on" note. */
export function formatReadOn(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface OfferPhoto {
  url: string;
  alt: string;
}

/**
 * Photographs the partner's own listing shows for this offer, as read from the
 * listing: `facts.images` is `[{ url, alt }]` and `facts.image_credit` names the
 * partner. Only https URLs are accepted, and at most six are kept.
 */
export function offerPhotos(facts: Record<string, unknown> | null | undefined): OfferPhoto[] {
  const raw = facts?.images;
  if (!Array.isArray(raw)) return [];
  const photos: OfferPhoto[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url : "";
    if (!/^https:\/\/[^\s]+$/.test(url)) continue;
    const alt = typeof record.alt === "string" ? record.alt : "";
    photos.push({ url, alt });
    if (photos.length === 6) break;
  }
  return photos;
}

/** The partner a photograph is credited to, e.g. "Klook". */
export function offerPhotoCredit(facts: Record<string, unknown> | null | undefined): string | null {
  const value = facts?.image_credit;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export interface OfferRating {
  score: number;
  scale: number;
  /** How the listing states the number of reviews, e.g. "3.0K" or "16,479". */
  countLabel: string;
}

/**
 * The aggregate rating the partner's listing shows, as read from the listing:
 * `facts.rating` is `{ score, scale, count_label }`. Only the overall score and
 * the review count are kept. Review text belongs to its authors and stays on the
 * partner's site.
 */
export function offerRating(facts: Record<string, unknown> | null | undefined): OfferRating | null {
  const raw = facts?.rating;
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const score = typeof record.score === "number" ? record.score : NaN;
  const scale = typeof record.scale === "number" ? record.scale : 5;
  const countLabel = typeof record.count_label === "string" ? record.count_label.trim() : "";
  if (!Number.isFinite(score) || score <= 0 || score > scale || countLabel.length === 0) return null;
  return { score, scale, countLabel };
}

export interface OfferInclusions {
  included: string[];
  notIncluded: string[];
}

function stringList(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

/** What the listing says is and is not covered, for the two-column block. */
export function offerInclusions(
  facts: Record<string, unknown> | null | undefined,
): OfferInclusions | null {
  const included = stringList(facts?.included_listed ?? facts?.included);
  const notIncluded = stringList(facts?.not_included);
  return included.length + notIncluded.length > 0 ? { included, notIncluded } : null;
}
