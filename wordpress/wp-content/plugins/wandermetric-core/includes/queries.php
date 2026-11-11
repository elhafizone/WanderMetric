<?php
/**
 * Reading offers. Templates call these instead of building WP_Query by hand,
 * so the filters (section, country, city) mean the same thing everywhere.
 */

defined( 'ABSPATH' ) || exit;

/**
 * @param array{section?: string, country?: string, city?: string, limit?: int, exclude?: int[]} $filter
 */
function wm_offer_query_args( array $filter ): array {
	$tax = array( 'relation' => 'AND' );
	if ( ! empty( $filter['section'] ) ) {
		$tax[] = array(
			'taxonomy' => 'wm_section',
			'field'    => 'slug',
			'terms'    => $filter['section'],
		);
	}
	if ( ! empty( $filter['city'] ) ) {
		$tax[] = array(
			'taxonomy'         => 'wm_place',
			'field'            => 'slug',
			'terms'            => $filter['city'],
			'include_children' => false,
		);
	} elseif ( ! empty( $filter['country'] ) ) {
		// A country matches offers filed on it and on any of its cities.
		$tax[] = array(
			'taxonomy'         => 'wm_place',
			'field'            => 'slug',
			'terms'            => $filter['country'],
			'include_children' => true,
		);
	}
	return array(
		'post_type'           => 'wm_offer',
		'post_status'         => 'publish',
		'posts_per_page'      => $filter['limit'] ?? -1,
		'post__not_in'        => $filter['exclude'] ?? array(),
		'tax_query'           => $tax, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
		'orderby'             => 'date',
		'order'               => 'DESC',
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	);
}

/** @return WP_Post[] */
function wm_get_offers( array $filter = array() ): array {
	return get_posts( wm_offer_query_args( $filter ) );
}

function wm_count_offers( array $filter = array() ): int {
	$args                   = wm_offer_query_args( $filter );
	$args['fields']         = 'ids';
	$args['posts_per_page'] = -1;
	return count( get_posts( $args ) );
}

/** The single section slug an offer is filed under. */
function wm_offer_section( int $post_id ): ?string {
	$terms = get_the_terms( $post_id, 'wm_section' );
	return ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->slug : null;
}

/**
 * Offers grouped by the place they sit in (city name, or the country itself
 * for country-wide products), for the place-led rails.
 *
 * @return array<string, WP_Post[]>
 */
function wm_group_by_place( array $offers ): array {
	$groups = array();
	foreach ( $offers as $offer ) {
		$place = wm_offer_place( $offer->ID );
		$label = $place['city'] ? $place['city']->name : ( $place['country'] ? $place['country']->name . ' (country-wide)' : 'Elsewhere' );
		$groups[ $label ][] = $offer;
	}
	return $groups;
}
