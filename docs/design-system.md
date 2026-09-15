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

**There is no dark theme.** An earlier revision shipped a
`prefers-color-scheme: dark` block that replaced every token with a near-black
palette, so anyone whose OS was set to dark — a large share of visitors — never
saw the light design at all. It is gone, and `color-scheme: light` on `:root`
stops the browser darkening form controls and scrollbars underneath us. If a
dark theme is ever wanted it should be an explicit toggle, not an ambient OS
preference that silently overrides the brand.

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

### Type on photography

Type over an image sits on a **warm ivory veil in charcoal**, never in white on
a dark scrim. Two earlier attempts went the other way, and both failed:

| Attempt | Result |
|---|---|
| Dark scrim at 0.82, dark photography | Legible, and the whole site read as dark |
| Light scrim at 0.42, bright photography | Looked right, measured 1.13:1 on the hero and 1.76:1 on the Rome card |

Both have the same cause: white type forces the picture to be dark. Inverting it
fixes contrast and lightness at once. The measured minimum across every overlay
surface is now **5.85:1**, and no dark gradient remains anywhere on the page.

The veil is a property of the **caption block**, not the picture frame. Sizing
it to the frame put the topmost line of a bottom-anchored caption in the weakest
part of the gradient — that is what left "Spain" at 1.8:1 while the headline
directly under it passed. Scoped to the text block, the fade lives in its own
top padding and the photograph above stays clear at any aspect ratio.

The home hero goes further and puts its type on a solid ivory plate overlapping
the lower edge of the image: charcoal on ivory is about 13:1, the photograph
keeps all of its light, and the first viewport contains a large warm image *and*
a panel of warm ivory, which is what makes the site read as light immediately.

`.masthead-veil` does the same job for the header, replacing a `from-black/45`
gradient that dimmed the brightest part of the best photograph on the site.

**Ember never sets small type over a photograph.** Terracotta `#a9502c` has a
relative luminance of 0.142, so 4.5:1 needs a background above 0.814 —
essentially undiluted ivory. No veil that leaves a photograph looking like a
photograph gets there. It reads at 5.1:1 on the hero plate and in section
headers, which is where it is used; eyebrows over imagery are charcoal.

### Brand photography

Brand images are chosen on measured light, not on taste. Each candidate is
sampled for mean luminance (0–255) and warmth (mean R minus mean B) before use:

| Image | Luminance | Warmth | Role |
|---|---|---|---|
| `horizon` | 130 | +45 | Home hero |
| `village` | 155 | −4 | Editorial band |
| `hills` | 105 | +32 | Closing panel |
| ~~`hero-coast`~~ | 94 | −18 | Retired — dark *and* cool, and the main reason the first screen read as a dark website |

### Section rhythm

`Band` gives each section its own ground: ivory, white or sand, in that rotation.
The page used to be one uninterrupted ivory canvas with transparent sections on
it, which meant photography was the only thing creating rhythm — so the
photography had to be dark to register. Three closely related warm tones do that
job instead, and let the imagery be bright.

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
3. **Content visibility beats the animation, in three layers.** Nothing is set
   up until a real animation frame arrives (`whenAnimatable`); anything already
   on screen is never hidden (`alreadyOnScreen`); and anything that ends up
   visible to the reader while still transparent has its inline styles stripped
   (`guardVisibility`). `gsap.from` means the server HTML is already correct, so
   no JavaScript, a failed chunk and reduced motion all leave the finished
   layout on screen.

   The frame gate is deliberately not `document.visibilityState === "visible"`.
   A document with no animation frames cannot play a tween, so applying the
   hidden half of a `from` leaves content invisible — but visibility and frame
   delivery are not the same thing, and embedded or occluded contexts report
   `hidden` while painting at 60fps. Asking whether a frame actually arrives is
   the only question that matches the failure.

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
