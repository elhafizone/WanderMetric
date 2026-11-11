<?php
/**
 * Old URLs, ported from next.config.ts (legacyRedirects) so inbound links and
 * rankings survive the move, plus the Next.js search URL and its security headers.
 * Order matters: specific paths come before the catch-alls. All are 301.
 * The www → apex redirect is done at the host (one canonical domain).
 */

defined( 'ABSPATH' ) || exit;

/** @return array<int, array{0: string, 1: string}> [regex on the path, target] */
function wm_legacy_redirects(): array {
	$cities = 'paris|rome|lyon|nice|naples|florence|seville|madrid|barcelona|kyoto|tokyo|porto|lisbon';
	return array(
		array( '#^/tours/rome/rome-colosseum-forum-palatine-guided-tour$#', '/tours-activities/italy/rome-colosseum-forum-palatine-guided-tour' ),
		array( '#^/tours/kyoto/kyoto-fushimi-inari-evening-walking-tour$#', '/tours-activities/japan/kyoto-fushimi-inari-evening-walking-tour' ),
		array( '#^/tours/aswan/aswan-abu-simbel-temples-full-day-guided-tour$#', '/tours-activities/egypt/aswan-abu-simbel-temples-full-day-guided-tour' ),
		array( '#^/activities/barcelona/barcelona-sagrada-familia-tickets-and-tours$#', '/tours-activities/spain/barcelona-sagrada-familia-tickets-and-tours' ),
		array( '#^/guides/travel-esim-guide$#', '/sim-cards' ),
		array( '#^/guides/airport-transfers-guide$#', '/transfers' ),
		array( '#^/guides/car-and-bike-rental-guide$#', '/car-rentals' ),
		array( '#^/guides/travel-insurance-guide$#', '/insurance' ),
		array( '#^/guides/flight-delay-compensation-eu$#', '/travel-services' ),
		array( '#^/guides(/.*)?$#', '/' ),
		array( '#^/deals(/.*)?$#', '/' ),
		array( '#^/destinations(/.*)?$#', '/' ),
		array( '#^/activities(/.*)?$#', '/tours-activities' ),
		array( '#^/tours(/.*)?$#', '/tours-activities' ),
		array( '#^/car-hire$#', '/car-rentals' ),
		array( '#^/esim$#', '/sim-cards' ),
		array( '#^/hotels/(' . $cities . ')(/[^/]+)?$#', '/hotels' ),
		array( '#^/flights/(paris-to-rome|lisbon-to-porto|tokyo-to-kyoto)$#', '/flights' ),
		array( '#^/news-sitemap\.xml$#', '/wp-sitemap.xml' ),
	);
}

add_action(
	'template_redirect',
	static function () {
		$path = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/', PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- only matched against fixed patterns.
		$path = '/' . trim( $path, '/' );

		// The Next.js search lived at /search?q=; WordPress searches at /?s=.
		if ( '/search' === $path ) {
			$q = isset( $_GET['q'] ) ? sanitize_text_field( wp_unslash( $_GET['q'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			wp_safe_redirect( $q ? add_query_arg( 's', rawurlencode( $q ), home_url( '/' ) ) : home_url( '/' ), 301 );
			exit;
		}

		foreach ( wm_legacy_redirects() as [ $pattern, $target ] ) {
			if ( preg_match( $pattern, $path ) ) {
				wp_safe_redirect( home_url( $target ), 301 );
				exit;
			}
		}
	},
	0
);

/** The same baseline security headers the Next.js site sent. */
add_action(
	'send_headers',
	static function () {
		if ( is_admin() ) {
			return;
		}
		header( 'X-Content-Type-Options: nosniff' );
		header( 'X-Frame-Options: SAMEORIGIN' );
		header( 'Referrer-Policy: strict-origin-when-cross-origin' );
		header( 'Permissions-Policy: camera=(), microphone=(), geolocation=()' );
	}
);
