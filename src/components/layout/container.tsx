/**
 * Page container.
 *
 * The side gutter is set once here rather than per page, so every route keeps
 * the same edge spacing at every width and nothing can drift. Full-bleed
 * sections opt out by rendering outside a Container and using `Bleed` for their
 * inner text column.
 */

const WIDTHS = {
  /** Reading and listing default. */
  default: "max-w-6xl",
  /** Editorial layouts that need the extra room for an asymmetric mosaic. */
  wide: "max-w-[84rem]",
  /** Article shells and forms. */
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
      className={`mx-auto w-full ${WIDTHS[width]} px-5 sm:px-8 lg:px-10 ${className ?? ""}`}
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
  tight: "gap-12 sm:gap-16",
  default: "gap-16 sm:gap-24",
  loose: "gap-20 sm:gap-32",
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
 * Standard padding for a page that does not open with a hero.
 *
 * The top value clears the fixed header, which is out of flow — a page that
 * forgets this renders its first line underneath the navigation.
 */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`pt-28 pb-24 sm:pt-36 sm:pb-32 ${className ?? ""}`}>{children}</div>
  );
}

/**
 * A full-bleed horizontal band with its own ground colour.
 *
 * The page used to be one uninterrupted ivory canvas with transparent sections
 * on it, which meant the only thing creating rhythm was photography — so the
 * photography had to be dark to register, and the page read dark. Alternating
 * three closely related warm tones does that job instead, and lets the imagery
 * be bright.
 *
 * The steps are deliberately narrow (ivory #fbf8f3, white #ffffff, sand
 * #f6f1e8). They should read as paper stock changing, not as stripes.
 */
const TONES = {
  ivory: "bg-bg",
  white: "bg-surface",
  sand: "bg-bg-tint",
} as const;

const BAND_PADDING = {
  default: "py-20 sm:py-28",
  tight: "py-14 sm:py-20",
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
