<?php
/**
 * The ten sections. Defined once here; they mirror the Travelpayouts categories
 * and are the first segment of every public offer URL. Editors cannot add,
 * rename or delete them: the list is the contract the URLs depend on.
 */

defined( 'ABSPATH' ) || exit;

/**
 * @return array<string, array{name: string, short: string, tagline: string}>
 */
function wm_sections(): array {
	return array(
		'tours-activities' => array(
			'name'    => 'Tours and activities',
			'short'   => 'Tours',
			'tagline' => 'Tickets, day tours, city passes and audio tours',
		),
		'hotels'           => array(
			'name'    => 'Hotels and stays',
			'short'   => 'Hotels',
			'tagline' => 'Where to stay in each city, and what to check before you book',
		),
		'car-rentals'      => array(
			'name'    => 'Car and bike rentals',
			'short'   => 'Cars',
			'tagline' => 'Compare car, scooter and bike rental providers',
		),
		'flights'          => array(
			'name'    => 'Flights',
			'short'   => 'Flights',
			'tagline' => 'Search fares, plus answers on baggage, check-in and refunds',
		),
		'trains-buses'     => array(
			'name'    => 'Trains and buses',
			'short'   => 'Trains',
			'tagline' => 'Train and bus tickets, and how each route works',
		),
		'transfers'        => array(
			'name'    => 'Transfers and airport',
			'short'   => 'Transfers',
			'tagline' => 'Compare airport and city transfer providers',
		),
		'package-tours'    => array(
			'name'    => 'Package tours',
			'short'   => 'Packages',
			'tagline' => 'Multi-day tours and private charters, and what each includes',
		),
		'insurance'        => array(
			'name'    => 'Insurance',
			'short'   => 'Insurance',
			'tagline' => 'What travel cover should include, and where to get a quote',
		),
		'sim-cards'        => array(
			'name'    => 'SIM cards and eSIM',
			'short'   => 'SIM',
			'tagline' => 'Compare travel eSIM data plans before you fly',
		),
		'travel-services'  => array(
			'name'    => 'Travel services',
			'short'   => 'Services',
			'tagline' => 'Flight compensation claims and luggage storage',
		),
	);
}

function wm_is_section( string $slug ): bool {
	return array_key_exists( $slug, wm_sections() );
}

/** Regex alternation of the section slugs, for rewrite rules. */
function wm_sections_pattern(): string {
	return implode( '|', array_map( 'preg_quote', array_keys( wm_sections() ) ) );
}

function wm_seed_sections(): void {
	foreach ( wm_sections() as $slug => $section ) {
		if ( ! term_exists( $slug, 'wm_section' ) ) {
			wp_insert_term(
				$section['name'],
				'wm_section',
				array(
					'slug'        => $slug,
					'description' => $section['tagline'],
				)
			);
		}
	}
}

/** Block any section term that is not one of the ten. */
add_filter(
	'pre_insert_term',
	static function ( $term, $taxonomy, $args = array() ) {
		if ( 'wm_section' !== $taxonomy ) {
			return $term;
		}
		$slug = isset( $args['slug'] ) && $args['slug'] ? $args['slug'] : sanitize_title( $term );
		if ( ! wm_is_section( $slug ) ) {
			return new WP_Error( 'wm_fixed_sections', __( 'Sections are fixed. Pick one of the ten existing sections.', 'wandermetric' ) );
		}
		return $term;
	},
	10,
	3
);

/** The fixed terms cannot be deleted either. */
add_action(
	'pre_delete_term',
	static function ( $term_id, $taxonomy ) {
		if ( 'wm_section' === $taxonomy ) {
			wp_die( esc_html__( 'Sections are fixed and cannot be deleted.', 'wandermetric' ), '', array( 'response' => 403 ) );
		}
	},
	10,
	2
);
