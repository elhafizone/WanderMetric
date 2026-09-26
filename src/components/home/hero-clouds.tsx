/**
 * Drifting cloud layers for the home hero.
 *
 * Three pre-rendered, horizontally wrapping cloud tiles — generated from
 * fractal noise by `scripts/generate-clouds.mjs`, not photographed and not
 * downloaded — each repeated across a strip one tile wider than the hero and
 * slid left by exactly one tile, forever. Because each tile's right edge flows
 * into its own left edge, the loop has no seam.
 *
 * The movement is a CSS keyframe (`.cloud-layer` in globals.css), not GSAP.
 * It runs from first paint, needs no hydration, animates `transform` only so
 * each tile is decoded once and then just composited, and stops under
 * `prefers-reduced-motion`. A Server Component with no JavaScript.
 *
 * The clouds are white and sit *behind* the headline, so they can only raise
 * the luminance under charcoal type — they never cost contrast.
 */

interface CloudLayer {
  /** File in /public/imagery/clouds, from scripts/generate-clouds.mjs. */
  name: "far" | "mid" | "near";
  /** Display width of one tile, in px. The drift travels exactly one tile. */
  tile: number;
  /** Seconds to cross one tile. Nearer layers move faster, which reads as depth. */
  duration: number;
  className: string;
}

const LAYERS: CloudLayer[] = [
  // Far: large, faint, slow — high haze across the whole sky.
  { name: "far", tile: 1800, duration: 260, className: "top-[-8%] h-[64%] opacity-60" },
  // Middle: the body of the cloud bank.
  { name: "mid", tile: 1500, duration: 170, className: "top-[2%] h-[52%] opacity-75" },
  // Near: low wisps of mist crossing the horizon, fastest of the three.
  { name: "near", tile: 1300, duration: 110, className: "top-[28%] h-[38%] opacity-55" },
];

export function HeroClouds() {
  return (
    <div aria-hidden="true" className="cloud-sky pointer-events-none absolute inset-0">
      {LAYERS.map((layer) => (
        <div
          key={layer.name}
          className={`cloud-layer ${layer.className}`}
          style={
            {
              backgroundImage: `url(/imagery/clouds/${layer.name}.webp)`,
              "--cloud-tile": `${layer.tile}px`,
              "--cloud-duration": `${layer.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
