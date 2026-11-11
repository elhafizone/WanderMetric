<?php
/**
 * Public URLs, kept identical to the Next.js site so search rankings carry over:
 *
 *   /{section}/                      section page
 *   /{section}/{country}/            section filtered to a country
 *   /{section}/{country}/{slug}/     an offer
 *   /countries/                      all countries
 *   /countries/{country}/            a country
 *   /countries/{country}/{city}/     a city
 *   /go/{slug}/                      affiliate redirect (go.php)
 *
 * The router sets `wm_route` and the theme picks a template for it.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'wm_register_routes', 20 );

function wm_register_routes(): void {
	$s = wm_sections_pattern();
	add_rewrite_tag( '%wm_route%', '([a-z-]+)' );
	add_rewrite_tag( '%wm_s%', '([a-z-]+)' );
	add_rewrite_tag( '%wm_country%', '([a-z0-9-]+)' );
	add_rewrite_tag( '%wm_city%', '([a-z0-9-]+)' );

	add_rewrite_rule( "^({$s})/([a-z0-9-]+)/([a-z0-9-]+)/?$", 'index.php?post_type=wm_offer&wm_offer=$matches[3]&wm_s=$matches[1]&wm_country=$matches[2]&wm_route=offer', 'top' );
	add_rewrite_rule( "^({$s})/([a-z0-9-]+)/?$", 'index.php?wm_route=section-country&wm_s=$matches[1]&wm_country=$matches[2]', 'top' );
	add_rewrite_rule( "^({$s})/?$", 'index.php?wm_route=section&wm_s=$matches[1]', 'top' );
	add_rewrite_rule( '^countries/([a-z0-9-]+)/([a-z0-9-]+)/?$', 'index.php?wm_route=city&wm_country=$matches[1]&wm_city=$matches[2]', 'top' );
	add_rewrite_rule( '^countries/([a-z0-9-]+)/?$', 'index.php?wm_route=country&wm_country=$matches[1]', 'top' );
	add_rewrite_rule( '^countries/?$', 'index.php?wm_route=countries', 'top' );
	add_rewrite_rule( "^compare/({$s})/?$", 'index.php?wm_route=compare-section&wm_s=$matches[1]', 'top' );
	add_rewrite_rule( '^compare/?$', 'index.php?wm_route=compare', 'top' );
}

/** Offer permalink: /{section}/{country}/{slug}/ */
add_filter(
	'post_type_link',
	static function ( string $link, WP_Post $post ) {
		if ( 'wm_offer' !== $post->post_type ) {
			return $link;
		}
		$section = wm_offer_section( $post->ID );
		$place   = wm_offer_place( $post->ID );
		if ( ! $section || ! $place['country'] || ! $post->post_name ) {
			return $link;
		}
		return home_url( user_trailingslashit( "{$section}/{$place['country']->slug}/{$post->post_name}" ) );
	},
	10,
	2
);

function wm_section_url( string $section, ?string $country = null ): string {
	return home_url( user_trailingslashit( $country ? "{$section}/{$country}" : $section ) );
}

function wm_country_url( string $country, ?string $city = null ): string {
	return home_url( user_trailingslashit( $city ? "countries/{$country}/{$city}" : "countries/{$country}" ) );
}

function wm_route(): string {
	return (string) get_query_var( 'wm_route' );
}

/**
 * Validate the route: unknown countries, cities, or an offer reached through
 * the wrong section/country path become a 404 (or a 301 to the canonical URL).
 */
add_action(
	'template_redirect',
	static function () {
		$route = wm_route();
		if ( ! $route ) {
			return;
		}
		global $wp_query;
		$country = (string) get_query_var( 'wm_country' );
		$bad     = false;

		if ( in_array( $route, array( 'section-country', 'country', 'city' ), true ) && ! wm_get_country( $country ) ) {
			$bad = true;
		}
		if ( 'city' === $route && ! wm_get_city( $country, (string) get_query_var( 'wm_city' ) ) ) {
			$bad = true;
		}
		if ( 'compare-section' === $route && ! wm_compare_section( (string) get_query_var( 'wm_s' ) ) ) {
			$bad = true;
		}
		if ( 'offer' === $route ) {
			$post = get_queried_object();
			if ( ! $post instanceof WP_Post ) {
				$bad = true;
			} else {
				$canonical = get_permalink( $post );
				$requested = home_url( user_trailingslashit( get_query_var( 'wm_s' ) . '/' . $country . '/' . $post->post_name ) );
				if ( $canonical && untrailingslashit( $canonical ) !== untrailingslashit( $requested ) ) {
					wp_safe_redirect( $canonical, 301 );
					exit;
				}
			}
		}
		if ( $bad ) {
			$wp_query->set_404();
			status_header( 404 );
			nocache_headers();
		} else {
			// Our virtual pages are real pages, not "nothing found".
			$wp_query->is_404  = false;
			$wp_query->is_home = false;
			status_header( 200 );
		}
	},
	5
);

/** Map routes to theme templates: wm-{route}.php, falling back to index.php. */
add_filter(
	'template_include',
	static function ( string $template ) {
		$route = wm_route();
		if ( ! $route || 'offer' === $route || is_404() ) {
			return $template;
		}
		$found = locate_template( array( "wm-{$route}.php" ) );
		return $found ? $found : $template;
	}
);
