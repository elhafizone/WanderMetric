<?php
/**
 * Places: a hierarchical taxonomy. Top-level terms are countries, children are
 * cities. An offer is filed under a city (its country is the parent) or, for
 * country-wide products such as eSIMs, directly under a country.
 * Destination is a filter, never a section.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Seed list: the countries and cities the existing offers use.
 *
 * @return array<string, array{name: string, cities: array<string, string>}>
 */
function wm_seed_place_list(): array {
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

/** Seed new places once whenever the list changes (deploys do not re-activate the plugin). */
add_action(
	'init',
	static function () {
		$hash = md5( (string) wp_json_encode( wm_seed_place_list() ) );
		if ( get_option( 'wm_places_hash' ) !== $hash ) {
			wm_seed_places();
			update_option( 'wm_places_hash', $hash, true );
		}
	},
	30
);

function wm_seed_places(): void {
	foreach ( wm_seed_place_list() as $country_slug => $country ) {
		$existing   = term_exists( $country_slug, 'wm_place', 0 );
		$country_id = $existing ? (int) $existing['term_id'] : (int) wp_insert_term( $country['name'], 'wm_place', array( 'slug' => $country_slug ) )['term_id'];
		foreach ( $country['cities'] as $city_slug => $city_name ) {
			if ( ! term_exists( $city_slug, 'wm_place' ) ) {
				wp_insert_term(
					$city_name,
					'wm_place',
					array(
						'slug'   => $city_slug,
						'parent' => $country_id,
					)
				);
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

/** @return WP_Term[] countries with at least one published offer, by name. */
function wm_countries_with_offers(): array {
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
	return array_values( array_filter( $terms, static fn( WP_Term $t ) => wm_count_offers( array( 'country' => $t->slug ) ) > 0 ) );
}
