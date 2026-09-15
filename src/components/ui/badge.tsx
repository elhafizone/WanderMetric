/**
 * Small status labels.
 *
 * `ember` is reserved for things that expire — a deal's end date, a closing
 * season. Using it anywhere else would spend the one colour on the site that
 * means "this will not be true next month".
 */
const TONES = {
  neutral: "bg-surface-2 text-ink-soft border-border",
  accent: "bg-accent-soft text-accent border-transparent",
  ember: "bg-ember-soft text-ember border-transparent",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide ${TONES[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
