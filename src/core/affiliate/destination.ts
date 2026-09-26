import { appError, err, ok, type Result } from "@/core/shared/result";

/**
 * Search placeholders in a stored destination URL.
 *
 * A link row can carry a destination such as
 * `https://www.klook.com/en-US/search/result/?query={q}` — a search at a brand,
 * where the visitor supplies only the search term. This is how the home search
 * reaches partner search results without ever accepting a URL from the visitor:
 * the scheme, host and path shape come from the database, and each value the
 * visitor controls is validated against a strict pattern and percent-encoded
 * before substitution. `encodeURIComponent` escapes `/`, `?`, `#` and `@`, so a
 * value cannot leave the URL component it was placed in, and the final host is
 * compared with the stored one as a second, independent check.
 *
 * Supported placeholders (formats verified against each brand in September
 * 2026 — see docs/travelpayouts.md):
 *
 *   {q}            free text, e.g. Klook `?query={q}`
 *   {q_slug}       the same text lower-cased and hyphenated, e.g. Airalo
 *                  `/{q_slug}-esim` or Welcome Pickups `/{q_slug}/`
 *   {origin}       IATA code, upper case
 *   {destination}  IATA code, upper case
 *   {ddmm}         departure date as DDMM, e.g. Aviasales
 *                  `/search/{origin}{ddmm}{destination}{return}1`
 *   {return}       return date as DDMM, or nothing for a one-way search. The
 *                  only placeholder that may legitimately be empty.
 *
 * A URL with no placeholders passes through untouched, so ordinary links are
 * unaffected.
 */

export interface SearchParams {
  q?: string | null;
  origin?: string | null;
  destination?: string | null;
  /** ISO date, YYYY-MM-DD, as a native date input submits it. */
  date?: string | null;
  /** Optional return date, same format. Empty means one-way. */
  returnDate?: string | null;
}

const PLACEHOLDER = /\{([a-z_]+)\}/g;

/** Letters in any script, digits, spaces and a little punctuation. */
const TEXT = /^[\p{L}\p{N}][\p{L}\p{N} '’.,&-]{0,79}$/u;
const IATA = /^[A-Za-z]{3}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function invalid(message: string) {
  return err(
    appError("VALIDATION_FAILED", message, {
      publicMessage: "That search could not be understood. Please try again.",
    }),
  );
}

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** YYYY-MM-DD to DDMM, or null when it is not a real calendar date. */
function toDdmm(iso: string | null | undefined): string | null {
  const match = ISO_DATE.exec(iso?.trim() ?? "");
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCDate() !== Number(day)) return null;
  return `${day}${month}`;
}

export function placeholdersIn(url: string): string[] {
  return [...url.matchAll(PLACEHOLDER)].flatMap((match) => (match[1] ? [match[1]] : []));
}

export function resolveDestination(
  storedUrl: string,
  params: SearchParams,
): Result<string> {
  const needed = placeholdersIn(storedUrl);
  if (needed.length === 0) return ok(storedUrl);

  const values: Record<string, string> = {};

  for (const name of new Set(needed)) {
    switch (name) {
      case "q":
      case "q_slug": {
        const text = params.q?.trim().replace(/\s+/g, " ") ?? "";
        if (!TEXT.test(text)) return invalid(`Invalid search text for {${name}}`);
        const value = name === "q" ? text : slugify(text);
        if (!value) return invalid("Search text has no usable characters");
        values[name] = value;
        break;
      }
      case "origin":
      case "destination": {
        const code = params[name]?.trim() ?? "";
        if (!IATA.test(code)) return invalid(`Invalid IATA code for {${name}}`);
        values[name] = code.toUpperCase();
        break;
      }
      case "ddmm": {
        const ddmm = toDdmm(params.date);
        if (!ddmm) return invalid("Invalid departure date");
        values[name] = ddmm;
        break;
      }
      case "return": {
        const raw = params.returnDate?.trim();
        if (!raw) {
          values[name] = "";
          break;
        }
        const ddmm = toDdmm(raw);
        if (!ddmm) return invalid("Invalid return date");
        // A return before the departure is a typo, not a trip.
        if (params.date && raw < params.date.trim()) return invalid("Return before departure");
        values[name] = ddmm;
        break;
      }
      default:
        // An unknown placeholder is a misconfigured row, not visitor input.
        return err(
          appError("VALIDATION_FAILED", `Unknown placeholder {${name}} in destination`, {
            publicMessage: "This link is misconfigured.",
          }),
        );
    }
  }

  const resolved = storedUrl.replace(PLACEHOLDER, (_, name: string) =>
    encodeURIComponent(values[name] ?? ""),
  );

  // The stored URL with placeholders removed fixes the host. Substitution must
  // never be able to change it.
  let storedHost: string;
  let resolvedUrl: URL;
  try {
    storedHost = new URL(storedUrl.replace(PLACEHOLDER, "x")).host;
    resolvedUrl = new URL(resolved);
  } catch {
    return invalid("Destination is not a valid URL");
  }
  if (resolvedUrl.host !== storedHost || !/^https?:$/.test(resolvedUrl.protocol)) {
    return invalid("Substitution changed the destination host");
  }

  return ok(resolvedUrl.toString());
}
