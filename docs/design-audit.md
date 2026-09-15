# Design audit — pre-redesign

Written before any file was changed, from a read of every public route, the
component library, `globals.css` and the Tailwind configuration.

## What existed

| Area | State |
|---|---|
| Tokens | 8 CSS variables in `globals.css`, described in-file as "deliberately small" |
| Type | Geist Sans + Geist Mono. One weight axis, no display face |
| Colour | Teal accent `#0b6e63`; near-neutral greys; dark theme at parity with light |
| Layout | One `Container` (max-w-6xl), one `Stack` (uniform gap), one `CardGrid` (3-up) |
| Cards | A single `ContentCard` used for destinations, guides, hotels, activities, deals |
| Motion | None, beyond a 300 ms image scale on card hover |
| Imagery | **Zero rows in `media`.** Every image on the site was a letter-on-gradient fallback |
| Client JS | Three client components total (subscribe form, admin bits) |

## Why it read as "dark, plain, template"

1. **One card, one grid, one rhythm.** Every section on every page was the same
   3-up grid of identical tiles. Nothing was ever featured, so nothing felt
   editorial — the homepage and the deals listing had the same visual weight.
2. **No display typography.** Headings were the body face at a larger size and
   `font-semibold`. That is the SaaS heading convention, not a magazine one.
3. **Dark mode at parity.** `prefers-color-scheme: dark` produced a near-black
   teal-grey site, which is what most visitors on modern OS defaults saw first.
4. **No photography, and a fallback that drew attention to itself.** The
   hue-rotated gradient with a giant initial is honest but reads as a missing
   asset, repeated 12 times per listing.
5. **Accent used as decoration.** The teal appeared on eyebrows, links, borders,
   buttons and hovers equally, so it signalled nothing in particular.
6. **Uniform vertical rhythm.** `Stack` gave every section the same gap, so the
   page had no cadence — no compression before a feature, no air after one.

## What was already right, and is preserved

- Server Components by default; the public site ships almost no JavaScript.
- `/go/[slug]` is the only outbound link path; no affiliate URL is ever in JSX.
- `createSupabasePublicClient` on every public page (cookie-free, static-safe).
- Explicit `sizes` on every `next/image`, aspect-ratio boxes around each one.
- Semantic landmarks, a skip link, `<details>`-based mobile nav needing no JS.
- Nothing fabricated: no price, rating or review is rendered anywhere.

These are constraints on the redesign, not obstacles to it.

## Decisions taken

**Imagery.** The database holds no media, and hotlinking is ruled out. Seven
photographs were licensed under the Unsplash License, downloaded, and are served
from `public/imagery/` — never hotlinked. They are wired in behind
`src/core/media/imagery.ts`, a framework-free registry that resolves in this
order: database `media` row → editorial registry entry → refined placeholder.
When Storage uploads are enabled, rows win automatically and the registry can be
deleted without touching a component. Credits live in `public/imagery/CREDITS.md`.

**Colour.** Light is canonical: warm ivory ground, sand surfaces, charcoal ink.
The accent moves from teal to a deep sage, reserved for interactive states and
brand marks only. A terracotta ember is added for time-sensitive badges. Colour
otherwise comes from photography.

**Type.** Fraunces (variable, display) for headings; Inter (variable) for UI and
body. Geist Sans and Geist Mono are dropped — that is a net reduction of one
loaded family, not an addition.

**Rhythm.** `Stack` gains named section spacing; listings gain an asymmetric
editorial mosaic alongside the existing grid, so a feature can outrank its
neighbours.

**Motion.** GSAP + ScrollTrigger, confined to `src/components/motion/`. Every
motion component is a client boundary that takes server-rendered children, so
the content inside stays a Server Component. Nothing animates that the reader
needs in order to navigate, and `prefers-reduced-motion` disables all of it.
