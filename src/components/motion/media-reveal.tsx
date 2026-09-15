"use client";

import { useEffect, useRef } from "react";

import { alreadyOnScreen, motion, motionEnabled } from "@/components/motion/runtime";

/**
 * Editorial image reveal: the frame opens upward over the photograph while the
 * photograph itself settles back from a slight overscale.
 *
 * Two layers moving at different rates, which is what separates this from a
 * fade — a fade says "loading", a clip reveal says "presented".
 *
 * `clipPath` rather than height, so nothing around the image reflows and the
 * work stays on the compositor. An image already on screen when GSAP finishes
 * loading is left exactly as painted.
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
        }).from(inner, { scale: 1.12, duration: 1.4, ease: "expo.out" }, 0);
      }, el);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={frame} className={className}>
      {children}
    </div>
  );
}
