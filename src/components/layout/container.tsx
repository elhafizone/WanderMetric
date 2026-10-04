/**
 * Page container.
 *
 * The side gutter is set once here rather than per page, so every route keeps
 * the same edge spacing at every width and nothing can drift. The identity's
 * container is 1280px including a 40px gutter (1200px of content), 32px on
 * tablets and 16px on a phone.
 */

const WIDTHS = {
  /** Listings and detail pages. */
  default: "max-w-[80rem]",
  /** Kept for existing call sites; the identity has one page width. */
  wide: "max-w-[80rem]",
  /** Long-form reading and forms. */
  narrow: "max-w-3xl",
} as const;

export function Container({
  children,
  className,
  width = "default",
}: {
  children: React.ReactNode;
  className?: string;
  width?: keyof typeof WIDTHS;
}) {
  return (
    <div
      className={`mx-auto w-full ${WIDTHS[width]} px-4 sm:px-8 lg:px-10 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/**
 * Vertical rhythm for a page's sections.
 *
 * `gap` is a named step rather than a number so a page cannot invent a spacing
 * value. "tight" compresses a run of related sections; "loose" gives a feature
 * room to breathe on either side.
 */
const GAPS = {
  tight: "gap-8 sm:gap-10",
  default: "gap-12 sm:gap-16",
  loose: "gap-16 sm:gap-24",
} as const;

export function Stack({
  children,
  className,
  gap = "default",
}: {
  children: React.ReactNode;
  className?: string;
  gap?: keyof typeof GAPS;
}) {
  return (
    <div className={`flex flex-col ${GAPS[gap]} ${className ?? ""}`}>{children}</div>
  );
}

/**
 * Standard padding for a page that does not open with its own header band.
 *
 * The site header is in flow (sticky, not fixed), so nothing needs to clear it.
 */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`pt-4 pb-16 sm:pt-6 sm:pb-24 ${className ?? ""}`}>{children}</div>;
}

/**
 * A full-bleed horizontal band with its own ground colour.
 *
 * Four closely related tones do the work photography used to have to do:
 * `ivory` is the page ground, `white` lifts a section onto a card-white
 * surface, `sand` is the cool-warm tint used for headers and filter areas, and
 * `lagoon` is the brand tint reserved for the "why trust us" band.
 */
const TONES = {
  ivory: "bg-bg",
  white: "bg-surface",
  sand: "bg-bg-tint",
  lagoon: "bg-accent-soft",
  warm: "bg-band-sand",
} as const;

const BAND_PADDING = {
  default: "py-12 sm:py-16",
  tight: "py-8 sm:py-12",
} as const;

export function Band({
  children,
  tone = "ivory",
  padding = "default",
  width = "wide",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
  padding?: keyof typeof BAND_PADDING;
  width?: keyof typeof WIDTHS;
  className?: string;
}) {
  return (
    <div className={`${TONES[tone]} ${BAND_PADDING[padding]} ${className ?? ""}`}>
      <Container width={width}>{children}</Container>
    </div>
  );
}
