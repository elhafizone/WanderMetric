/**
 * Editorial imagery registry.
 *
 * The `media` table is the real source of photography, and a row always wins.
 * This registry is the fallback beneath it: a small, explicit set of licensed
 * photographs served from `/public/imagery`, keyed by the thing they actually
 * depict.
 *
 * Three rules it exists to enforce:
 *
 * 1. **Nothing is hotlinked.** Every file here is committed to the repository
 *    and served from our own origin, so no third party can change, throttle or
 *    remove what a reader sees.
 * 2. **A key only maps to a photograph of that place.** `paris` is a photograph
 *    of Paris. There is no generic "city" image standing in for a named
 *    destination, because a picture of somewhere else is a fabrication in the
 *    same way an invented price is.
 *
 *    City images are used as *context* on city-scoped cards — an attraction in
 *    Barcelona may be illustrated by a photograph of Barcelona — and every alt
 *    text describes what is actually in the frame, so nothing ever claims to
 *    depict a specific venue. Hotels are deliberately excluded from this: a
 *    photograph above a property name reads as a picture of that property.
 * 3. **It is deletable.** When Storage uploads are enabled and `media` rows
 *    exist, this file can be removed without touching a single component —
 *    `resolveImage` in `src/lib/media.ts` already prefers the row.
 *
 * Licensing and attribution live in `public/imagery/CREDITS.md`.
 */

export interface EditorialImage {
  /** Absolute path from the site root. */
  src: string;
  width: number;
  height: number;
  /** Describes what is in the frame. Never the page title. */
  alt: string;
  /** CSS `object-position`, for crops whose subject is not centred. */
  focus?: string;
  credit: {
    photographer: string;
    source: string;
    sourceUrl: string;
  };
}

const unsplash = (photographer: string, sourceUrl: string) => ({
  photographer,
  source: "Unsplash",
  sourceUrl,
});

/**
 * Brand surfaces: scenery, not a claim about any particular destination, and
 * the only images here allowed to be non-specific.
 *
 * Held separately from the place map and read through `brandImage()` so the
 * hero and the closing panel get a guaranteed image rather than an optional
 * one — a homepage whose hero might be undefined is not a state worth writing
 * a fallback for.
 */
const BRAND = {
  hero: {
    src: "/imagery/hero-coast.jpg",
    width: 2400,
    height: 1348,
    alt: "Two lighthouses on a rocky, tree-covered peninsula reaching into open sea, seen from the air",
    focus: "50% 55%",
    credit: unsplash("Daniel R.", "https://unsplash.com/@misterjackdaniel"),
  },
  horizon: {
    src: "/imagery/horizon.jpg",
    width: 2000,
    height: 1125,
    alt: "An empty road curving between sunlit rock formations in late afternoon light",
    focus: "50% 60%",
    credit: unsplash("Jack Cohen", "https://unsplash.com/@jackcohen"),
  },
} as const satisfies Record<string, EditorialImage>;

export type BrandImageKey = keyof typeof BRAND;

export function brandImage(key: BrandImageKey): EditorialImage {
  return BRAND[key];
}

/** Photographs of named places, keyed by the city or country slug they depict. */
export const editorialImagery: Record<string, EditorialImage> = {
  paris: {
    src: "/imagery/paris.jpg",
    width: 1800,
    height: 1350,
    alt: "The Eiffel Tower lit at night, seen down a Parisian street past a café",
    focus: "50% 40%",
    credit: unsplash("Lens by Benji", "https://unsplash.com/@lens_by_benji"),
  },
  rome: {
    src: "/imagery/rome.jpg",
    width: 1800,
    height: 1200,
    alt: "The façade of St Peter's Basilica in Vatican City, hung with red drapery",
    focus: "50% 45%",
    credit: unsplash("Gabriella Clare Marino", "https://unsplash.com/@gabiontheroad"),
  },
  barcelona: {
    src: "/imagery/barcelona.jpg",
    width: 1800,
    height: 1200,
    alt: "Visitors crossing an open square in front of a Modernista façade in Barcelona",
    focus: "50% 45%",
    credit: unsplash("Colin + Meg", "https://unsplash.com/@colinandmeg"),
  },
  lisbon: {
    src: "/imagery/lisbon.jpg",
    width: 1800,
    height: 1197,
    alt: "A yellow tram climbing a narrow street between tiled buildings in Lisbon",
    focus: "50% 50%",
    credit: unsplash("Aayush Gupta", "https://unsplash.com/@aayush_gupta"),
  },
  tokyo: {
    src: "/imagery/tokyo.jpg",
    width: 1800,
    height: 1200,
    alt: "An illuminated temple gate above a busy Tokyo street after dark",
    focus: "50% 45%",
    credit: unsplash("mos design", "https://unsplash.com/@mosdesign"),
  },
};

/**
 * Resolves the first key that has an image.
 *
 * Callers pass the most specific key first — a city before its country — so a
 * Lisbon page uses the Lisbon photograph and a Portugal page can fall back to
 * it only if `portugal` is deliberately mapped. Unknown keys return null rather
 * than a substitute, which is what keeps rule 2 above true.
 */
export function editorialImage(
  ...keys: Array<string | null | undefined>
): EditorialImage | null {
  for (const key of keys) {
    if (!key) continue;
    const found = editorialImagery[key];
    if (found) return found;
  }
  return null;
}

/**
 * Pulls place keys out of a slug.
 *
 * Guide cards carry no city relation — that lives on the detail shape, and
 * widening the card select would change what `/api/v1/guides` returns. Instead
 * the slug is read for whole tokens that name a place we hold a photograph of:
 * `eating-well-in-rome` yields `rome`, `shoulder-season-southern-europe` yields
 * nothing and falls through to the placeholder.
 *
 * It can only ever return an image of a place the slug itself names, which is
 * what keeps it honest rather than merely convenient.
 */
export function placeKeysFromSlug(slug: string): string[] {
  return slug.split("-").filter((token) => Object.hasOwn(editorialImagery, token));
}
