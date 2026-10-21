import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * The site's four button treatments.
 *
 * Kept few on purpose. A travel page that offers five visually distinct
 * actions has not decided what it wants the reader to do.
 *
 * - `cta`       Marigold. The one fill that means "search or book": it leaves
 *               the site for a partner, or runs a search. Ink label only (9.6:1).
 * - `primary`   Lagoon. The main move inside the site
 * - `secondary` an equally legitimate alternative route
 * - `quiet`     a link that happens to need a hit area
 *
 * All are pills: the photographs and cards carry the angles, the controls are
 * the soft shapes.
 */
const VARIANTS = {
  cta: "bg-cta text-on-cta hover:bg-cta-hover font-bold shadow-sm hover:shadow-md",
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover font-bold shadow-sm hover:shadow-md",
  secondary:
    "border border-border-strong text-ink bg-transparent hover:border-ink hover:bg-surface",
  quiet: "text-ink hover:text-accent",
} as const;

const SIZES = {
  sm: "min-h-11 px-5 py-2 text-sm",
  md: "min-h-11 px-6 py-2.5 text-[0.9375rem]",
  lg: "min-h-[3.25rem] px-8 py-3.5 text-base",
} as const;

// 44px minimum hit target on every size.
const BASE =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-editorial disabled:opacity-60";

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
  withArrow = false,
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
        <ArrowRight
          aria-hidden="true"
          className="ease-editorial h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5"
        />
      )}
    </Link>
  );
}
