# Design system

The visual language of the public site. Admin is deliberately excluded: it is a
tool, not a publication, and inherits only the colour tokens.

Positioning: **editorial travel + modern premium + utility**. It should read as
a travel publication that happens to be useful, not as a booking funnel. The
affiliate relationship is disclosed in words and invisible as a design idea.

---

## Tokens

All of it lives in `src/app/globals.css`. Nothing defines a colour, radius or
easing outside that file.

**Two variable layers.** `--wm-*` on `:root` are the real values and are
readable from hand-written CSS. `@theme inline` re-exports them as Tailwind
tokens (`bg-surface`, `text-ink-muted`, `ease-editorial`). The `inline` keyword
means Tailwind inlines those values into the utilities it generates rather than
publishing them on `:root` — so `var(--font-display)` resolves to nothing in a
stylesheet, and hand-written rules must reference `--wm-*` or the next/font
variables directly. This caught us once; it is why `.display` reads
`--font-fraunces`.

### Colour

Light is canonical. Every decision was made and reviewed against it.

| Role | Light | Notes |
|---|---|---|
| `bg` | `#fbf8f3` | Warm ivory. The page ground |
| `bg-tint` | `#f6f1e8` | Footer and section breaks |
| `surface` | `#ffffff` | Cards, panels |
| `surface-2` / `-3` | `#f3eee4` / `#eae3d5` | Sand. Image wells, placeholders |
| `border` / `-strong` | `#e6dece` / `#d6cbb6` | Hairlines, then visible edges |
| `ink` / `-soft` / `-muted` | `#201d18` / `#4a443b` / `#6e6658` | Charcoal, never pure black |
| `accent` | `#3d5b46` | Deep sage. Interactive state and the wordmark |
| `ember` | `#a9502c` | Terracotta. **Only** for things that expire |
| `on-media` | `#ffffff` | Fixed, not themed — it sits on a photograph |

Colour otherwise comes from photography. The accent is not decoration: if it
appears on something that is not interactive or not the brand, that is a bug.
`ember` spent on anything but an expiry date devalues the one colour that means
"this will not be true next month".

Dark mode is kept functional under `prefers-color-scheme` — warm charcoal, not
blue-black — but it is explicitly not the brand.

### Type

Two variable families, both self-hosted by `next/font`. Geist Sans and Geist
Mono were removed, so the redesign loads one family fewer than before.

| Face | Role |
|---|---|
| **Fraunces** (variable, `opsz` + `SOFT`) | Display only. Headings, the wordmark, card titles. Never body copy |
| **Inter** (variable) | UI and body copy |
| system mono | IATA and ISO codes only |

Classes: `.display` (large headlines, `opsz` 120), `.display-sm` (card and panel
titles, `opsz` 48), `.eyebrow` (tracked-out small caps — sans, not mono, because
mono on a travel publication reads as a developer tool).

### Radius, elevation, motion

Radii are restrained — `rounded-xl` is 1rem. A 24px corner reads as an app card;
here the photograph should be the shape you notice. Shadows are warm-tinted so
cards sit on the ivory ground rather than floating above a cooler one.
`--wm-dur-*` and `--wm-ease-*` are shared by CSS transitions and GSAP, so a
card's hover and its scroll reveal agree with each other.

---

## Components

```
components/
  layout/     Container (default | wide | narrow), Stack (tight | default | loose),
              PageShell, SiteHeader, SiteFooter
  ui/         ContentCard, FeatureCard, Mosaic, EmptyState, DetailHero,
              SectionHeader, PageHeader, FactPanel, Badge, ButtonLink,
              MediaImage, MediaPlaceholder, Prose, Breadcrumbs, Pagination
  motion/     Reveal, Parallax, MediaReveal, runtime
  home/       HomeHero, GuideShowcase, Comparison, EditorialBand, FinalCta
```

Two card treatments, not five. `ContentCard` sets type on paper beneath the
photograph — that is what lets a listing of twelve stay readable. `FeatureCard`
sets type *on* the photograph and is reserved for a slot that is genuinely being
promoted; used everywhere it becomes a wall of overlaid text, which is the
affiliate-site look this design exists to avoid.

`Mosaic` gives its first child roughly twice the area of the next two and
degrades honestly — one item is a single feature, two is a pair, and a trailing
row picks its column count from what is left so the grid never shows a hole.

---

## Motion

GSAP with ScrollTrigger, confined to `src/components/motion/`. Three rules:

1. **The hero entrance is CSS, not GSAP.** The hero is the LCP element and is
   server rendered. A JavaScript entrance can only start after hydration, which
   means the browser paints the finished hero and then hides it again. A
   keyframe whose 0% frame is the hidden state applies at first paint instead.
   See `.intro-*` in globals.css.
2. **GSAP is imported dynamically, inside an effect.** It is ~110 kB and nothing
   about rendering, reading or navigating the page needs it. Loading it
   statically would put it in the initial payload; this way it arrives after the
   page is interactive, only on routes that use it.
3. **Nothing animates from a hidden start unless it is off screen.** Every
   motion component checks `alreadyOnScreen()` first and uses `gsap.from`, so
   content is correct in the server HTML, correct if the chunk never loads, and
   correct with reduced motion — the library only ever adds movement to
   something already right.

`prefers-reduced-motion` cancels the CSS sequence in one rule and short-circuits
every effect via `motionEnabled()`.

---

## Imagery

`src/core/media/imagery.ts` and `resolveImage()` in `src/lib/media.ts`.

Resolution order: **`media` row → editorial registry → placeholder.** A row
always wins, so the registry can be deleted the day Storage uploads are enabled
without touching a component.

The registry holds seven photographs under the Unsplash License, committed to
the repository and served from our own origin — nothing is hotlinked. Credits
are in `public/imagery/CREDITS.md` and shown on full-bleed brand imagery.

A key only ever maps to a photograph of that place. City images are used as
*context* on city-scoped cards, and every alt text describes what is actually in
the frame, so nothing claims to depict a specific venue. **Hotels are excluded
from this**: a photograph above a property name reads as a picture of that
property.

`MediaPlaceholder` handles the rest: paper tone, hairline rules and the initial
in the display face. It should read as a deliberate blank in a magazine, not as
an asset that failed to load.
