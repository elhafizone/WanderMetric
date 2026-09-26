/**
 * Generates the hero's cloud layers: public/imagery/clouds/{far,mid,near}.webp.
 *
 *   node scripts/generate-clouds.mjs
 *
 * Each layer is fractal noise turned into soft white alpha, made to wrap
 * horizontally so the hero can repeat a tile and scroll it forever without a
 * seam. The wrap is a cross-fade done here rather than `stitchTiles="stitch"`:
 * librsvg, which sharp renders SVG with, stitches in quadrants and leaves hard
 * seams through the middle of the tile.
 *
 * Rendered here once rather than as a live SVG filter in the page. The filter
 * version worked, but a browser has to re-run turbulence over a multi-thousand-
 * pixel layer whenever it rasterises it, and on the dev machine that stalled
 * the compositor badly enough to blank the whole hero. A pre-rendered WebP is a
 * plain image: decoded once, then only moved.
 *
 * The alpha curve is alpha = gain × noise + offset. The noise is centred near
 * 0.5 (measured: p50 ≈ 0.50, p95 ≈ 0.72), so `offset` sets where cloud begins
 * and `gain` how quickly it thickens. Tuned so about half of each layer is
 * clear sky; a gentler curve fills the frame with milk.
 *
 * `sharp` comes with Next.js (it is what next/image uses), so this needs no
 * dependency of its own.
 */

import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const OUT = new URL("../public/imagery/clouds/", import.meta.url);

const LAYERS = [
  // Far: large, faint shapes — high haze across the whole sky.
  { name: "far", seed: 11, frequency: [0.0018, 0.0034], gain: 2.5, offset: -1.25, width: 1800 },
  // Middle: the body of the cloud bank.
  { name: "mid", seed: 4, frequency: [0.0028, 0.005], gain: 4.7, offset: -2.5, width: 1500 },
  // Near: low wisps of mist crossing the horizon.
  { name: "near", seed: 23, frequency: [0.0036, 0.0075], gain: 5.4, offset: -2.9, width: 1300 },
];

/** Stored at half size: the shapes are soft, so upscaling costs nothing visible. */
const STORE_SCALE = 0.5;

/** Width of the cross-faded band that joins a tile's right edge to its left. */
const OVERLAP = 360;

await mkdir(OUT, { recursive: true });

for (const layer of LAYERS) {
  const { width } = layer;
  const height = Math.round(width / 2);
  const [fx, fy] = layer.frequency;
  const span = width + OVERLAP;

  // Colour rows fix a warm white; the alpha row reads the noise's red channel.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${span}" height="${height}">
    <filter id="c" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="3" seed="${layer.seed}"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.985  0 0 0 0 0.955  ${layer.gain} 0 0 0 ${layer.offset}"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#c)"/>
  </svg>`;

  const noise = await sharp(Buffer.from(svg)).blur(4).raw().toBuffer();
  const tile = Buffer.alloc(width * height * 4);

  // Make the tile wrap: over its first OVERLAP columns, fade from the noise
  // that continues past the right edge (x + width) into the noise at x. Column
  // 0 then equals column `width` of the source, which is exactly what follows
  // column `width - 1` — so the right edge flows into the next copy's left.
  //
  // Only alpha is blended. Colour is written as the fixed warm white, because
  // fully transparent source pixels carry black RGB and mixing it in greys the
  // cloud wherever the fade crosses an edge.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = x < OVERLAP ? x / OVERLAP : 1;
      const eased = t * t * (3 - 2 * t);
      const here = (y * span + x) * 4 + 3;
      const wrapped = (y * span + x + width) * 4 + 3;
      const out = (y * width + x) * 4;
      tile[out] = 255;
      tile[out + 1] = 251;
      tile[out + 2] = 244;
      tile[out + 3] = Math.round(noise[wrapped] * (1 - eased) + noise[here] * eased);
    }
  }

  const file = new URL(`${layer.name}.webp`, OUT);
  const info = await sharp(tile, { raw: { width, height, channels: 4 } })
    .resize(Math.round(width * STORE_SCALE), Math.round(height * STORE_SCALE))
    .webp({ quality: 60, alphaQuality: 100, effort: 6 })
    .toFile(file.pathname.replace(/^\/([A-Za-z]:)/, "$1"));

  console.log(`${layer.name}.webp  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(1)} kB`);
}
