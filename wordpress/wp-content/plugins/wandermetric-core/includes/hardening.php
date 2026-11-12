<?php
/**
 * Hardening a plugin can do (the host handles the rest).
 *
 * - User enumeration: anonymous visitors cannot list accounts. The REST users
 *   routes need a signed-in user, ?author=N no longer redirects to the
 *   account's slug, author archives (the site has none worth reading) send
 *   visitors home, and oEmbed responses stop naming the account.
 * - HSTS: a browser that has seen the site over HTTPS refuses plain HTTP for a
 *   year. No includeSubDomains or preload: both are slow to undo.
 */

defined( 'ABSPATH' ) || exit;

add_filter(
	'rest_endpoints',
	static function ( array $endpoints ): array {
		if ( is_user_logged_in() ) {
			return $endpoints;
		}
		foreach ( array_keys( $endpoints ) as $route ) {
			if ( str_starts_with( (string) $route, '/wp/v2/users' ) ) {
				unset( $endpoints[ $route ] );
			}
		}
		return $endpoints;
	}
);

// Priority 1: before redirect_canonical (10) turns ?author=1 into /news/author/<login>.
add_action(
	'template_redirect',
	static function () {
		if ( is_user_logged_in() ) {
			return;
		}
		if ( is_author() || isset( $_GET['author'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only its presence is read.
			wp_safe_redirect( home_url( '/' ), 301 );
			exit;
		}
	},
	1
);

add_filter(
	'oembed_response_data',
	static function ( array $data ): array {
		unset( $data['author_name'], $data['author_url'] );
		return $data;
	}
);

add_action(
	'send_headers',
	static function () {
		if ( ! is_admin() && 'https' === wp_parse_url( home_url(), PHP_URL_SCHEME ) ) {
			header( 'Strict-Transport-Security: max-age=31536000' );
		}
	}
);
