"use client";

import { useEffect, useRef } from "react";

import {
  alreadyOnScreen,
  guardVisibility,
  motion,
  motionEnabled,
  whenAnimatable,
} from "@/components/motion/runtime";

/**
 * Editorial image reveal: the frame opens upward over the photograph while the
 * photograph itself settles back from a slight overscale.
 *
 * Two layers moving at different rates, which is what separates this from a
 * fade — a fade says "loading", a clip reveal says "presented".
 *
 * `clipPath` rather than height, so nothing around the image reflows and the
 * work stays on the compositor. It carries the same three visibility
 * guarantees as `Reveal`: never set up while the document is hidden, never
 * applied to something already on screen, and force-cleared if an image ends up
 * visible to the reader while still clipped.
 */
export function MediaReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frame.current;
    if (!el || !motionEnabled() || alreadyOnScreen(el)) return;

    const inner = el.firstElementChild;
    if (!inner) return;

    let cancelled = false;
    let ctx: gsap.Context | undefined;
    let releaseGuard: (() => void) | undefined;

    const stopWaiting = whenAnimatable(() => {
      void motion().then((gsap) => {
        if (cancelled || !frame.current) return;

        ctx = gsap.context(() => {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: "top 86%", once: true },
          });

          tl.from(el, {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 1.05,
            ease: "expo.out",
            clearProps: "clipPath",
          }).from(inner, { scale: 1.08, duration: 1.4, ease: "expo.out" }, 0);
        }, el);

        releaseGuard = guardVisibility([el]);
      });
    });

    return () => {
      cancelled = true;
      stopWaiting();
      releaseGuard?.();
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={frame} className={className}>
      {children}
    </div>
  );
}
