"use client";

import type { gsap as GsapType } from "gsap";

/**
 * The only module in the app that imports GSAP.
 *
 * Everything else goes through the components in this directory, so GSAP lands
 * in exactly one pair of chunks instead of being pulled into every component
 * that wants a transition. Nothing in `src/app/(public)` imports it directly.
 *
 * The import is dynamic and happens inside an effect, which is the whole point:
 * GSAP plus ScrollTrigger is around 110 kB and none of it is needed to render,
 * read or navigate the page. Loading it statically would put it in the initial
 * payload and make the browser fetch an animation library before it has
 * finished with the article.
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
 * make it blink out and re-enter, so those are left alone and only elements the
 * reader has yet to scroll to are animated.
 */
export function alreadyOnScreen(element: Element, margin = 0.9): boolean {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight * margin && rect.bottom > 0;
}

/**
 * Runs `start` only once the browser is actually delivering animation frames,
 * and returns a teardown.
 *
 * GSAP's ticker is driven by requestAnimationFrame. A document that is getting
 * no frames cannot play a tween, so setting up a `from` tween there applies the
 * hidden half — opacity 0 — with no way to undo it, and the content stays
 * invisible. That is not hypothetical: it is what a link opened in a background
 * tab does, and it is how an earlier revision could leave a whole section of
 * the homepage blank.
 *
 * The obvious gate is `document.visibilityState === "visible"`, and it is the
 * wrong one. Visibility and frame delivery are related but not the same, and
 * embedded or occluded contexts report `hidden` while still painting at 60fps —
 * a gate on the flag refuses to animate in exactly the environments where
 * animation works fine. So this asks the only question that matters: does a
 * frame actually arrive? If one does, run. If none arrives, back off and wait
 * for the document to come back, then ask again.
 */
export function whenAnimatable(start: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let disposed = false;
  let frame = 0;
  let timer = 0;

  function clear() {
    if (frame) cancelAnimationFrame(frame);
    if (timer) window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", attempt);
    frame = 0;
    timer = 0;
  }

  function attempt() {
    if (disposed) return;
    clear();

    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      clear();
      start();
    });

    timer = window.setTimeout(() => {
      timer = 0;
      if (disposed) return;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      document.addEventListener("visibilitychange", attempt);
    }, 300);
  }

  attempt();

  return () => {
    disposed = true;
    clear();
  };
}

/**
 * Last line of defence: content the reader can see must never be invisible.
 *
 * Watches the given elements and, if one is intersecting the viewport but still
 * effectively transparent a moment later, strips the inline styles GSAP left on
 * it. A stalled ticker, a killed timeline, a ScrollTrigger that measured the
 * page before the images settled — none of them can produce a permanently blank
 * section once this is running.
 *
 * It deliberately does not fire for elements that are merely off screen: those
 * are supposed to be waiting, and clearing them early would cancel the reveal
 * before the reader ever reaches it.
 *
 * The grace period is set past the longest run this app schedules — a 0.85s
 * tween plus five steps of 0.09s stagger, about 1.3s — so it rescues stuck
 * content without ever snapping a reveal that was playing normally.
 */
export function guardVisibility(elements: Element[], graceMs = 2000): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};

  const timers = new Map<Element, number>();

  const reveal = (element: Element) => {
    const style = (element as HTMLElement).style;
    const opacity = Number(getComputedStyle(element).opacity);
    if (Number.isNaN(opacity) || opacity >= 0.99) return;
    style.removeProperty("opacity");
    style.removeProperty("transform");
    style.removeProperty("clip-path");
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const existing = timers.get(entry.target);
      if (entry.isIntersecting) {
        if (existing !== undefined) continue;
        timers.set(
          entry.target,
          window.setTimeout(() => {
            reveal(entry.target);
            timers.delete(entry.target);
          }, graceMs),
        );
      } else if (existing !== undefined) {
        window.clearTimeout(existing);
        timers.delete(entry.target);
      }
    }
  });

  for (const element of elements) observer.observe(element);

  return () => {
    observer.disconnect();
    for (const id of timers.values()) window.clearTimeout(id);
    timers.clear();
  };
}
