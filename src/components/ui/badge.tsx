import { Clock } from "lucide-react";

/**
 * Small status labels.
 *
 * `ember` is reserved for things that expire — a deal's end date, a closing
 * season — and always carries a clock and words, never colour alone. Using it
 * anywhere else would spend the one colour on the site that means "this will
 * not be true next month".
 *
 * `solid-ember` is the same signal at full weight, for a badge that sits on a
 * photograph (the last 48 hours of a deal).
 */
const TONES = {
  neutral: "bg-bg-tint text-ink-soft",
  accent: "bg-accent-soft text-accent",
  secondary: "bg-secondary-soft text-secondary",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  ember: "bg-ember-soft text-ember border border-ember",
  "solid-ember": "bg-ember text-white",
  outline: "border border-border-strong text-ink-soft bg-surface",
} as const;

export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
  /** An icon before the label. Ember badges get a clock automatically. */
  icon?: React.ReactNode;
  className?: string;
}) {
  const showClock = !icon && (tone === "ember" || tone === "solid-ember");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs/4 font-bold ${TONES[tone]} ${className ?? ""}`}
    >
      {icon}
      {showClock && <Clock aria-hidden="true" className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}
