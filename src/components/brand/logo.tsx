/**
 * The WanderMetric logo, from the "Survey" identity.
 *
 * A free-wandering route that resolves into a measured tick: the route is
 * Lagoon, the origin dot is ink, and the tick at the end is the "metric".
 * Geometry is the identity's 48-unit grid, unchanged (dot r4.5 at 8,13; route
 * 8,13 → 16,35 → 23,21 → 30,35 → 38,13; tick 32→44 at y13; stroke 5, round
 * caps and joins). Clear space is the height of the dot (9 units).
 *
 * Inline rather than an <img>, for two reasons: the wordmark is live text in the
 * page's own Bricolage Grotesque (next/font hashes the family name, so a
 * standalone SVG file could never reach it), and the colours come from the
 * tokens, so the logo can never drift from the palette.
 *
 * Minimum sizes: the mark 16px (below 24px use the favicon), the horizontal
 * lockup 96px wide.
 */

const DISPLAY = "var(--font-bricolage), var(--font-manrope), system-ui, sans-serif";

type Tone = "default" | "reversed";

const TONES: Record<Tone, { dot: string; route: string; word: string; accent: string }> = {
  default: {
    dot: "var(--wm-ink)",
    route: "var(--wm-accent)",
    word: "var(--wm-ink)",
    accent: "var(--wm-accent)",
  },
  // On a Lagoon or photographic ground: white route, Marigold origin.
  reversed: {
    dot: "var(--wm-cta)",
    route: "#ffffff",
    word: "#ffffff",
    accent: "#ffffff",
  },
};

function Route({ tone }: { tone: Tone }) {
  const c = TONES[tone];
  return (
    <>
      <circle cx="8" cy="13" r="4.5" fill={c.dot} />
      <path
        d="M8 13 L16 35 L23 21 L30 35 L38 13"
        fill="none"
        stroke={c.route}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 13 H44" fill="none" stroke={c.route} strokeWidth="5" strokeLinecap="round" />
    </>
  );
}

/** Horizontal lockup: mark plus wordmark. */
export function Logo({ className, tone = "default" }: { className?: string; tone?: Tone }) {
  const c = TONES[tone];
  return (
    <svg
      viewBox="0 0 250 48"
      role="img"
      aria-label="WanderMetric"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Route tone={tone} />
      <text
        x="56"
        y="34"
        fontWeight="700"
        fontSize="30"
        letterSpacing="-0.5"
        textLength="192"
        lengthAdjust="spacing"
        style={{ fontFamily: DISPLAY }}
      >
        <tspan fill={c.word}>wander</tspan>
        <tspan fill={c.accent}>metric</tspan>
      </text>
    </svg>
  );
}

/** Icon-only mark, for compact placements. */
export function LogoMark({ className, tone = "default" }: { className?: string; tone?: Tone }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="WanderMetric"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Route tone={tone} />
    </svg>
  );
}
