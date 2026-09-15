"use client";

import { useEffect, useRef } from "react";

import { alreadyOnScreen, motion, motionEnabled } from "@/components/motion/runtime";

/**
 * Staggered entrance for a group of elements as it scrolls into view.
 *
 * Takes server-rendered children. React keeps anything passed as `children` to
 * a client component on the server, so wrapping a section in `<Reveal>` costs
 * this component's own bytes and nothing else — the cards inside stay Server
 * Components.
 *
 * It animates its *direct children*, which is why no `data-` attributes are
 * needed on the content, and it uses `gsap.from`: the elements are already
 * visible in the server HTML, so no JavaScript, a failed chunk or reduced
 * motion all leave the finished layout on screen rather than a blank section.
 */
export function Reveal({
  children,
  className,
  y = 22,
  stagger = 0.09,
  start = "top 88%",
}: {
  children: React.ReactNode;
  className?: string;
  /** Distance in pixels the children rise from. */
  y?: number;
  stagger?: number;
  /** ScrollTrigger start, for sections that need to fire earlier or later. */
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionEnabled() || alreadyOnScreen(el)) return;

    const targets = Array.from(el.children);
    if (targets.length === 0) return;

    let cancelled = false;
    let ctx: gsap.Context | undefined;

    void motion().then((gsap) => {
      if (cancelled || !ref.current) return;
      ctx = gsap.context(() => {
        gsap.from(targets, {
          opacity: 0,
          y,
          duration: 0.85,
          stagger,
          scrollTrigger: { trigger: el, start, once: true },
          // Inline transforms left behind would fight the CSS hover transitions
          // on the cards underneath, so they are cleared once the run finishes.
          clearProps: "transform,opacity",
        });
      }, el);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [y, stagger, start]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
