<?php
/**
 * Places: a hierarchical taxonomy. Top-level terms are countries, children are
 * cities. An offer is filed under a city (its country is the parent) or, for
 * country-wide products such as eSIMs, directly under a country.
 * Destination is a filter, never a section.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Every place an offer can be filed under: the places the site launched with,
 * plus content/places.json (copied to data/places.json by bundle-offers.sh),
 * which the catalogue feeds extend.
 *
 * @return array<string, array{name: string, cities: array<string, string>}>
 */
function wm_seed_place_list(): array {
	static $list = null;
	if ( null !== $list ) {
		return $list;
	}
	$list = wm_launch_place_list();
	$file = WM_CORE_DIR . 'data/places.json';
	$data = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
	foreach ( (array) ( $data['countries'] ?? array() ) as $slug => $country ) {
		if ( ! is_string( $slug ) || ! preg_match( '/^[a-z0-9-]+$/', $slug ) || ! is_array( $country ) || empty( $country['name'] ) ) {
			continue;
		}
		$list[ $slug ]['name']   = $list[ $slug ]['name'] ?? (string) $country['name'];
		$list[ $slug ]['cities'] = $list[ $slug ]['cities'] ?? array();
		foreach ( (array) ( $country['cities'] ?? array() ) as $city => $name ) {
			if ( is_string( $city ) && preg_match( '/^[a-z0-9-]+$/', $city ) && is_string( $name ) && '' !== $name && ! isset( $list[ $slug ]['cities'][ $city ] ) ) {
				$list[ $slug ]['cities'][ $city ] = $name;
			}
		}
	}
	return $list;
}

/** The countries and cities of the offers the site launched with. */
function wm_launch_place_list(): array {
	return array(
		'egypt'    => array( 'name' => 'Egypt', 'cities' => array( 'aswan' => 'Aswan' ) ),
		'france'   => array( 'name' => 'France', 'cities' => array( 'paris' => 'Paris' ) ),
		'italy'    => array( 'name' => 'Italy', 'cities' => array( 'rome' => 'Rome', 'florence' => 'Florence' ) ),
		'japan'    => array( 'name' => 'Japan', 'cities' => array( 'tokyo' => 'Tokyo', 'kyoto' => 'Kyoto' ) ),
		'portugal' => array( 'name' => 'Portugal', 'cities' => array( 'lisbon' => 'Lisbon' ) ),
		'spain'    => array( 'name' => 'Spain', 'cities' => array( 'barcelona' => 'Barcelona', 'madrid' => 'Madrid' ) ),
		'turkey'   => array( 'name' => 'Turkey', 'cities' => array( 'istanbul' => 'Istanbul' ) ),
		'greece'   => array( 'name' => 'Greece', 'cities' => array( 'athens' => 'Athens' ) ),
		'united-arab-emirates' => array( 'name' => 'United Arab Emirates', 'cities' => array( 'dubai' => 'Dubai' ) ),
		'united-kingdom' => array( 'name' => 'United Kingdom', 'cities' => array( 'london' => 'London' ) ),
		'thailand' => array( 'name' => 'Thailand', 'cities' => array( 'bangkok' => 'Bangkok', 'phuket' => 'Phuket' ) ),
	);
}

/**
 * Seed new places once whenever the list changes (deploys do not re-activate
 * the plugin). With hundreds of places this is a few seconds of term inserts,
 * so it runs in the admin, in WP-Cron (the bundle import calls it first) and
 * in WP-CLI, never inside a visitor's page view.
 */
add_action(
	'init',
	static function () {
		if ( is_admin() || wp_doing_cron() || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
			wm_maybe_seed_places();
		}
	},
	30
);

function wm_maybe_seed_places(): void {
	// The "v2" prefix re-runs seeding once on sites seeded before the slug-only check.
	$hash = md5( 'v2' . wp_json_encode( wm_seed_place_list() ) );
	if ( get_option( 'wm_places_hash' ) !== $hash ) {
		wm_seed_places();
		update_option( 'wm_places_hash', $hash, true );
	}
}

function wm_seed_places(): void {
	foreach ( wm_seed_place_list() as $country_slug => $country ) {
		$existing = term_exists( $country_slug, 'wm_place', 0 );
		if ( ! $existing ) {
			$existing = wp_insert_term( $country['name'], 'wm_place', array( 'slug' => $country_slug ) );
		}
		if ( is_wp_error( $existing ) || empty( $existing['term_id'] ) ) {
			error_log( 'wandermetric: place not created (' . $country_slug . '): ' . ( is_wp_error( $existing ) ? $existing->get_error_message() : 'unknown error' ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			continue;
		}
		$country_id = (int) $existing['term_id'];
		foreach ( $country['cities'] as $city_slug => $city_name ) {
			// By slug only: term_exists() also matches a name, so the US "Manchester"
			// (manchester-united-states) would hide the UK one (manchester).
			if ( get_term_by( 'slug', $city_slug, 'wm_place' ) ) {
				continue;
			}
			$made = wp_insert_term(
				$city_name,
				'wm_place',
				array(
					'slug'   => $city_slug,
					'parent' => $country_id,
				)
			);
			if ( is_wp_error( $made ) ) {
				error_log( 'wandermetric: place not created (' . $city_slug . '): ' . $made->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			}
		}
	}
}

/**
 * The place an offer is filed under, resolved to country and (optional) city.
 *
 * @return array{country: ?WP_Term, city: ?WP_Term}
 */
function wm_offer_place( int $post_id ): array {
	$terms = get_the_terms( $post_id, 'wm_place' );
	$out   = array(
		'country' => null,
		'city'    => null,
	);
	if ( ! $terms || is_wp_error( $terms ) ) {
		return $out;
	}
	$term = $terms[0];
	if ( $term->parent ) {
		$out['city']    = $term;
		$parent         = get_term( $term->parent, 'wm_place' );
		$out['country'] = $parent instanceof WP_Term ? $parent : null;
	} else {
		$out['country'] = $term;
	}
	return $out;
}

function wm_get_country( string $slug ): ?WP_Term {
	$term = get_term_by( 'slug', $slug, 'wm_place' );
	return ( $term instanceof WP_Term && 0 === (int) $term->parent ) ? $term : null;
}

function wm_get_city( string $country_slug, string $city_slug ): ?WP_Term {
	$country = wm_get_country( $country_slug );
	$city    = get_term_by( 'slug', $city_slug, 'wm_place' );
	return ( $country && $city instanceof WP_Term && (int) $city->parent === (int) $country->term_id ) ? $city : null;
}

/**
 * Countries with at least one published offer matching $filter, by name.
 *
 * @return WP_Term[]
 */
function wm_countries_with_offers( array $filter = array() ): array {
	$counts = wm_place_counts( $filter )['country'];
	if ( ! $counts ) {
		return array();
	}
	$terms = get_terms(
		array(
			'taxonomy'   => 'wm_place',
			'parent'     => 0,
			'hide_empty' => false,
			'orderby'    => 'name',
		)
	);
	if ( is_wp_error( $terms ) ) {
		return array();
	}
	return array_values( array_filter( $terms, static fn( WP_Term $t ) => isset( $counts[ $t->slug ] ) ) );
}

/**
 * The countries with the most offers matching $filter, most first.
 *
 * @return array<int, array{term: WP_Term, count: int}>
 */
function wm_top_countries( int $limit, array $filter = array() ): array {
	$counts = wm_place_counts( $filter )['country'];
	$out    = array();
	foreach ( wm_countries_with_offers( $filter ) as $term ) {
		$out[] = array(
			'term'  => $term,
			'count' => $counts[ $term->slug ],
		);
	}
	usort( $out, static fn( $a, $b ) => array( $b['count'], $a['term']->name ) <=> array( $a['count'], $b['term']->name ) );
	return $limit > 0 ? array_slice( $out, 0, $limit ) : $out;
}
