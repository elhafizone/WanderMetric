"use client";

import { useEffect, useRef } from "react";

import { motion, motionEnabled, whenAnimatable } from "@/components/motion/runtime";

/**
 * Scroll-linked parallax for a full-bleed image layer.
 *
 * Used sparingly, and only where it tells the reader something: a photograph
 * that drifts slower than the words over it reads as depth rather than
 * decoration. It is not applied to card imagery, where it would just make a
 * listing feel unstable.
 *
 * The inner layer is deliberately taller than its frame. Moving a layer that
 * exactly fills its parent would expose the background at one end of the
 * travel; the overscan is what lets the crop stay full at both extremes, and it
 * is sized from `strength` so the two can never drift apart. That sizing is
 * plain CSS, so the section is correctly composed before GSAP arrives and stays
 * correct if it never does — the library only adds the movement.
 */
export function Parallax({
  children,
  className,
  strength = 9,
}: {
  children: React.ReactNode;
  className?: string;
  /** Percentage of the frame height the layer travels in each direction. */
  strength?: number;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frameEl = frame.current;
    const layerEl = layer.current;
    if (!frameEl || !layerEl || !motionEnabled()) return;

    let cancelled = false;
    let ctx: gsap.Context | undefined;

    // Parallax never hides anything, so it needs no visibility guard — but it
    // still waits for a live frame loop, because a scrub set up without frames
    // just sits at its start value.
    const stopWaiting = whenAnimatable(() => {
      void motion().then((gsap) => {
        if (cancelled || !frame.current) return;
        ctx = gsap.context(() => {
          gsap.fromTo(
            layerEl,
            { yPercent: -strength },
            {
              yPercent: strength,
              ease: "none",
              scrollTrigger: {
                trigger: frameEl,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }, frameEl);
      });
    });

    return () => {
      cancelled = true;
      stopWaiting();
      ctx?.revert();
    };
  }, [strength]);

  const overscan = strength * 2;

  return (
    <div ref={frame} className={`overflow-hidden ${className ?? ""}`}>
      <div
        ref={layer}
        className="absolute inset-x-0"
        style={{ top: `-${strength}%`, height: `${100 + overscan}%` }}
      >
        {children}
      </div>
    </div>
  );
}
