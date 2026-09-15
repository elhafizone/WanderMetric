"use client";

import { useEffect, useRef } from "react";

/**
 * A hairline that tracks how far through the article the reader is.
 *
 * Scoped to the article element, not the document: a bar that counts the footer
 * and the related-reading rail as "article" reaches 60% at the last paragraph
 * and lies to the reader about how much is left.
 *
 * Deliberately cheap. It is a 2px element whose `transform: scaleX` is written
 * straight to the node from a rAF callback — no React state per scroll event,
 * one `getBoundingClientRect` per frame and nothing that can force a reflow.
 * Progress is transform-only, so it stays on the compositor.
 *
 * It holds at opacity 0 until there is progress worth showing, so it never
 * appears as an empty rule across the top of the masthead. It is `aria-hidden`:
 * the information is decorative, and a screen reader announcing a percentage on
 * every scroll tick would be actively hostile.
 *
 * ## Reduced motion
 *
 * This one keeps running. It is a direct readout of scroll position — the same
 * category as the browser's own scrollbar, which `prefers-reduced-motion` does
 * not remove — rather than an autonomous animation playing at the reader. The
 * only genuinely animated part is the fade in and out of the rule itself, and
 * the global `prefers-reduced-motion` block in globals.css already collapses
 * every transition duration to nothing, so that resolves to an instant switch
 * without this component needing to branch.
 *
 * Nothing on the page is hidden by it either way, so it cannot participate in
 * the failure mode the motion runtime guards against: there is no state of this
 * component in which content is invisible.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const article = document.getElementById(targetId);
    const el = bar.current;
    if (!article || !el) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      // How much of the article has passed the top of the viewport, over the
      // distance it can travel before its end reaches the top.
      const travelled = -rect.top;
      const distance = rect.height - window.innerHeight;
      const ratio = distance <= 0 ? (travelled > 0 ? 1 : 0) : travelled / distance;
      const clamped = Math.min(1, Math.max(0, ratio));
      el.style.transform = `scaleX(${clamped})`;
      el.style.opacity = clamped > 0.002 ? "1" : "0";
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]"
    >
      <div
        ref={bar}
        className="bg-accent ease-editorial h-full w-full origin-left opacity-0 transition-opacity duration-300"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
