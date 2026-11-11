<?php
/**
 * The WanderMetric logo, unchanged from the "Survey" identity.
 *
 * A free-wandering route that resolves into a measured tick. Geometry on the
 * 48-unit grid: dot r4.5 at 8,13; route 8,13 → 16,35 → 23,21 → 30,35 → 38,13;
 * tick 32→44 at y13; stroke 5, round caps and joins. The wordmark is live text
 * in Bricolage Grotesque 700 (self-hosted). Colours come from CSS tokens
 * (.logo-dot, .logo-route, .logo-word, .logo-accent) so they never drift.
 *
 * Minimum sizes: the mark 16px, the horizontal lockup 96px wide.
 */

defined( 'ABSPATH' ) || exit;

function wm_logo_route(): string {
	return '<circle class="logo-dot" cx="8" cy="13" r="4.5"/>'
		. '<path class="logo-route" d="M8 13 L16 35 L23 21 L30 35 L38 13" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
		. '<path class="logo-route" d="M32 13 H44" fill="none" stroke-width="5" stroke-linecap="round"/>';
}

/** Horizontal lockup. $tone: 'default' on light grounds, 'reversed' on Lagoon or photographs. */
function wm_logo( string $tone = 'default' ): string {
	return sprintf(
		'<svg class="logo logo--%1$s" viewBox="0 0 250 48" role="img" aria-label="WanderMetric" xmlns="http://www.w3.org/2000/svg">%2$s<text x="56" y="34" font-weight="700" font-size="30" letter-spacing="-0.5" textLength="192" lengthAdjust="spacing"><tspan class="logo-word">wander</tspan><tspan class="logo-accent">metric</tspan></text></svg>',
		esc_attr( $tone ),
		wm_logo_route()
	);
}

/** Favicons: the same files the Next.js site served. */
add_action(
	'wp_head',
	static function () {
		if ( has_site_icon() ) {
			return; // An icon set in Customizer wins.
		}
		$base = get_template_directory_uri() . '/assets/img/brand/';
		printf( '<link rel="icon" href="%s" type="image/svg+xml">' . "\n", esc_url( $base . 'wm-favicon.svg' ) );
		printf( '<link rel="icon" href="%s" type="image/png" sizes="32x32">' . "\n", esc_url( $base . 'icon.png' ) );
		printf( '<link rel="apple-touch-icon" href="%s">' . "\n", esc_url( $base . 'apple-icon.png' ) );
	},
	3
);
