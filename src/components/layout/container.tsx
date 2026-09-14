/**
 * Page container.
 *
 * The side gutter is set once here rather than per page, so every route keeps
 * the same edge spacing at every width and nothing can drift.
 */
export function Container({
  children,
  className,
  width = "default",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "default" | "narrow";
}) {
  const max = width === "narrow" ? "max-w-3xl" : "max-w-6xl";
  return (
    <div className={`mx-auto w-full ${max} px-5 ${className ?? ""}`}>{children}</div>
  );
}

/** Vertical rhythm for a stack of page sections. */
export function Stack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-12 py-10 sm:gap-16 sm:py-14 ${className ?? ""}`}>
      {children}
    </div>
  );
}
