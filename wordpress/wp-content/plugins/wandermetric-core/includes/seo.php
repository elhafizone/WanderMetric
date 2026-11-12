<?php
/**
 * Titles, descriptions, canonicals and robots for the virtual pages, so no SEO
 * plugin is needed. Thin country pages stay out of the index.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Title and description for the current route, or null outside our routes.
 *
 * @return array{title: string, description: string, canonical: string}|null
 */
function wm_page_meta(): ?array {
	$route    = wm_route();
	$sections = wm_sections();
	$s        = (string) get_query_var( 'wm_s' );
	$country  = wm_get_country( (string) get_query_var( 'wm_country' ) );

	switch ( $route ) {
		case 'section':
			return isset( $sections[ $s ] ) ? array(
				'title'       => $sections[ $s ]['name'],
				'description' => $sections[ $s ]['tagline'] . '. Facts read from each partner listing, with the date.',
				'canonical'   => wm_section_url( $s ),
			) : null;
		case 'section-country':
			return ( isset( $sections[ $s ] ) && $country ) ? array(
				'title'       => $sections[ $s ]['name'] . ' in ' . $country->name,
				'description' => $sections[ $s ]['tagline'] . ' in ' . $country->name . '.',
				'canonical'   => wm_section_url( $s, $country->slug ),
			) : null;
		case 'country':
			return $country ? array(
				'title'       => $country->name . ': tickets, transfers, eSIMs and more',
				'description' => 'What to book for ' . $country->name . ', read from each partner listing.',
				'canonical'   => wm_country_url( $country->slug ),
			) : null;
		case 'city':
			$city = $country ? wm_get_city( $country->slug, (string) get_query_var( 'wm_city' ) ) : null;
			return $city ? array(
				'title'       => $city->name . ', ' . $country->name,
				'description' => 'Tickets, transfers and practical bookings for ' . $city->name . ', read from each partner listing.',
				'canonical'   => wm_country_url( $country->slug, $city->slug ),
			) : null;
		case 'compare':
			return array(
				'title'       => 'Compare travel providers',
				'description' => 'Choose a category. We compare providers within it, because a flight can’t be set against an eSIM.',
				'canonical'   => home_url( user_trailingslashit( 'compare' ) ),
			);
		case 'compare-section':
			$c = wm_compare_section( $s );
			return $c ? array(
				'title'       => 'Compare ' . strtolower( $c['name'] ),
				'description' => 'Providers in this category only. Compare on their sites; you book with the provider.',
				'canonical'   => home_url( user_trailingslashit( 'compare/' . $s ) ),
			) : null;
		case 'countries':
			return array(
				'title'       => 'Countries',
				'description' => 'Every country with offers on WanderMetric.',
				'canonical'   => home_url( user_trailingslashit( 'countries' ) ),
			);
	}
	return null;
}

// Title, description, social tags and schema are printed by seo-head.php.

/** Our routes print their own canonical; stop core printing a wrong one. */
add_action(
	'wp',
	static function () {
		if ( wm_route() && 'offer' !== wm_route() ) {
			remove_action( 'wp_head', 'rel_canonical' );
		}
	}
);

/** True once at least one news post is published. Until then /news is an empty shell. */
function wm_has_news(): bool {
	return (int) wp_count_posts( 'post' )->publish > 0;
}

/** noindex: an empty news page, thin country pages and the section+country filter pages below the threshold. */
add_filter(
	'wp_robots',
	static function ( array $robots ) {
		if ( is_home() && ! wm_has_news() ) {
			$robots['noindex'] = true;
			$robots['follow']  = true;
			return $robots;
		}
		$route = wm_route();
		if ( in_array( $route, array( 'country', 'section-country', 'city' ), true ) ) {
			$filter = array( 'country' => (string) get_query_var( 'wm_country' ) );
			if ( 'section-country' === $route ) {
				$filter['section'] = (string) get_query_var( 'wm_s' );
			}
			if ( 'city' === $route ) {
				$filter = array( 'city' => (string) get_query_var( 'wm_city' ) );
			}
			if ( wm_count_offers( $filter ) < WM_MIN_OFFERS_FOR_COUNTRY_PAGE ) {
				$robots['noindex'] = true;
				$robots['follow']  = true;
			}
		}
		return $robots;
	}
);
