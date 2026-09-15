import Link from "next/link";

/**
 * The site's three button treatments.
 *
 * Kept to three on purpose. A travel page that offers four visually distinct
 * actions has not decided what it wants the reader to do, and the commercial
 * one always ends up shouting loudest.
 *
 * - `primary`   one per view, the thing we actually want them to do next
 * - `secondary` an equally legitimate alternative route
 * - `quiet`     a link that happens to need a hit area
 */
const VARIANTS = {
  primary:
    "bg-accent text-accent-contrast hover:bg-accent-hover shadow-sm hover:shadow-md",
  secondary:
    "border border-border-strong text-ink bg-surface hover:border-ink hover:bg-surface-2",
  quiet: "text-ink hover:text-accent",
} as const;

const SIZES = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
} as const;

const BASE =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-editorial disabled:opacity-60";

export function buttonClass(
  variant: keyof typeof VARIANTS = "primary",
  size: keyof typeof SIZES = "md",
): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  withArrow = true,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  withArrow?: boolean;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant, size)} ${className ?? ""}`}>
      {children}
      {withArrow && (
        <span
          aria-hidden="true"
          className="ease-editorial transition-transform duration-200 group-hover/btn:translate-x-0.5"
        >
          →
        </span>
      )}
    </Link>
  );
}
