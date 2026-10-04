/**
 * Turns the `facts` object stored on an offer guide into display rows.
 *
 * Framework-free. Facts are whatever the partner listing stated, so the shape is
 * open: this module only decides how to label and flatten them. Nothing is
 * invented here, an absent key simply produces no row.
 */

export interface FactRow {
  label: string;
  value: string;
}

export interface OfferOption {
  name: string;
  detail: string;
}

/** Keys that are shown as their own section, not as a row. */
const SECTION_KEYS = new Set(["options", "unclear_on_listing"]);

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
    if (text) rows.push({ label: LABELS[key] ?? humanise(key), value: text });
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
