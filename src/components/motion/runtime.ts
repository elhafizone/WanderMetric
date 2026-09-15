"use client";

import type { gsap as GsapType } from "gsap";

/**
 * The only module in the app that imports GSAP.
 *
 * Everything else goes through the components in this directory, so GSAP lands
 * in exactly one chunk instead of being pulled into every component that wants
 * a transition. Nothing in `src/app/(public)` imports it directly.
 *
 * The import is dynamic and happens inside an effect, which is the whole point:
 * GSAP plus ScrollTrigger is around 110 kB of JavaScript, and none of it is
 * needed to render, read or navigate the page. Loading it statically would put
 * it in the initial payload and make the browser fetch an animation library
 * before it has finished with the article. This way the page is interactive
 * first and the library arrives afterwards, on the pages that actually use it.
 */

type Gsap = typeof GsapType;

let loading: Promise<Gsap> | null = null;

export function motion(): Promise<Gsap> {
  loading ??= (async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out", duration: 0.8 });
    return gsap;
  })();

  return loading;
}

/**
 * Whether decorative motion should run at all.
 *
 * Checked when an effect runs rather than cached, so a reader who turns reduced
 * motion on mid-session is respected on the next navigation without a reload.
 */
export function motionEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True when an element has already been painted in (or close to) the viewport.
 *
 * Because GSAP arrives asynchronously, anything on screen at that moment has
 * already been seen in its final state. Animating it from a hidden start would
 * make it blink out and re-enter — so these are left alone and only elements
 * the reader has yet to scroll to are animated. It also means a failed or slow
 * chunk can never leave content invisible: the page is correct before the
 * library loads, and correct if it never does.
 */
export function alreadyOnScreen(element: Element, margin = 0.9): boolean {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight * margin && rect.bottom > 0;
}
