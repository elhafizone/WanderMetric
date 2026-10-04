# Image credits

Every photograph in this directory is used under the
[Unsplash License](https://unsplash.com/license), which permits free commercial
use. Files are **downloaded and served from our own origin** — nothing on the
site hotlinks an external image host.

Attribution is not required by the licence but is given anyway, both here and,
for full-bleed brand imagery, visibly on the page.

| File | Photographer | Source | Used for |
|---|---|---|---|
| `horizon.jpg` | Jack Cohen | https://unsplash.com/@jackcohen | Home hero |
| `village.jpg` | Tania Lyahnovich | https://unsplash.com/@tatiratata | Editorial band |
| `hills.jpg` | Drew Walker | https://unsplash.com/@drewwalkerphoto | Closing panel |
| `paris.jpg` | Lens by Benji | https://unsplash.com/@lens_by_benji | Paris / France |
| `rome.jpg` | Gabriella Clare Marino | https://unsplash.com/@gabiontheroad | Rome / Italy |
| `barcelona.jpg` | Colin + Meg | https://unsplash.com/@colinandmeg | Barcelona / Spain |
| `lisbon.jpg` | Aayush Gupta | https://unsplash.com/@aayush_gupta | Lisbon / Portugal |
| `tokyo.jpg` | mos design | https://unsplash.com/@mosdesign | Tokyo / Japan |
| `offers/rome-colosseum-forum-palatine-guided-tour.jpg` | Matteo del Piano | https://unsplash.com/@matteodelpiano | Rome Colosseum guide |
| `offers/kyoto-fushimi-inari-evening-walking-tour.jpg` | David Emrich | https://unsplash.com/@davidemrich | Kyoto Fushimi Inari guide |
| `offers/barcelona-sagrada-familia-tickets-and-tours.jpg` | Adam Young | https://unsplash.com/@hossua34 | Barcelona Sagrada Familia guide |
| `offers/aswan-abu-simbel-temples-full-day-guided-tour.jpg` | Tang wei-chen | https://unsplash.com/@weichen | Aswan Abu Simbel guide |

`hero-coast.jpg` (Daniel R.) was removed: measured at 94 mean luminance and
−18 warmth, it was both dark and cool, and as the hero it was the main reason
the site read as a dark website. Brand images are now selected on measured
light — see the note in `src/core/media/imagery.ts`.

These are a fallback layer only. The `media` table is the real source of
photography; once rows exist, `resolveImage()` prefers them and this directory
can be deleted.
