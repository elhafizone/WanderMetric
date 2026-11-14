<?php
/**
 * Reading offers. Templates call these instead of building WP_Query by hand,
 * so the filters (section, country, city, tier) mean the same thing everywhere.
 * Counting and grouping read the offer index (offer-index.php); only the
 * offers a page actually shows are loaded as posts.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Published offers, editorial first, then catalogue offers by weight.
 *
 * @param array{section?: string, country?: string, city?: string, tier?: string, wide?: bool, limit?: int, exclude?: int[]} $filter
 * @return WP_Post[]
 */
function wm_get_offers( array $filter = array() ): array {
	return wm_offers_by_id( wm_offer_ids( $filter ) );
}

/**
 * Posts for IDs, in the order given (meta and terms primed in two queries).
 *
 * @param int[] $ids
 * @return WP_Post[]
 */
function wm_offers_by_id( array $ids ): array {
	if ( ! $ids ) {
		return array();
	}
	return get_posts(
		array(
			'post_type'           => 'wm_offer',
			'post_status'         => 'publish',
			'post__in'            => $ids,
			'orderby'             => 'post__in',
			'posts_per_page'      => count( $ids ),
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);
}

function wm_count_offers( array $filter = array() ): int {
	unset( $filter['limit'] );
	return count( wm_offer_ids( $filter ) );
}

/** The single section slug an offer is filed under. */
function wm_offer_section( int $post_id ): ?string {
	$terms = get_the_terms( $post_id, 'wm_section' );
	return ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->slug : null;
}

/** Place names by slug, from one terms query. @return array<string, string> */
function wm_place_names(): array {
	static $names = null;
	if ( null === $names ) {
		$names = array();
		foreach ( (array) get_terms( array( 'taxonomy' => 'wm_place', 'hide_empty' => false ) ) as $t ) {
			if ( $t instanceof WP_Term ) {
				$names[ $t->slug ] = $t->name;
			}
		}
	}
	return $names;
}

/**
 * Offers grouped for a listing page, without loading them.
 *
 * by 'place': one group per city, plus one per country for country-wide
 * products (eSIMs, insurance); biggest first. by 'section': the ten sections
 * in their fixed order. Each group carries the page that lists all of it.
 *
 * @param array{section?: string, country?: string, city?: string, tier?: string} $filter
 * @return array<int, array{key: string, label: string, count: int, ids: int[], url: ?string}>
 */
function wm_offer_groups( array $filter, string $by ): array {
	unset( $filter['limit'] );
	$names  = wm_place_names();
	$groups = array();
	foreach ( wm_offer_index() as $id => $row ) {
		if ( ! wm_offer_row_matches( $row, $filter ) ) {
			continue;
		}
		if ( 'section' === $by ) {
			$key = $row['section'];
		} else {
			$key = '' !== $row['city'] ? $row['city'] : 'country:' . $row['country'];
		}
		if ( ! isset( $groups[ $key ] ) ) {
			$groups[ $key ] = array(
				'key'   => $key,
				'row'   => $row,
				'count' => 0,
				'ids'   => array(),
			);
		}
		$groups[ $key ]['count']++;
		$groups[ $key ]['ids'][] = $id;
	}

	$sections = wm_sections();
	$out      = array();
	foreach ( $groups as $key => $g ) {
		$row = $g['row'];
		if ( 'section' === $by ) {
			if ( ! isset( $sections[ $key ] ) ) {
				continue;
			}
			$label = $sections[ $key ]['name'];
			// A city has no section-by-city page: its own page already shows everything.
			$url = ! empty( $filter['city'] ) ? null : wm_section_url( $key, $filter['country'] ?? null );
		} elseif ( '' !== $row['city'] ) {
			$label = $names[ $row['city'] ] ?? $row['city'];
			$url   = wm_country_url( $row['country'], $row['city'] );
		} else {
			$label = ( $names[ $row['country'] ] ?? $row['country'] ) . ( empty( $filter['country'] ) ? '' : ' (country-wide)' );
			$url   = ! empty( $filter['section'] ) ? wm_section_url( $filter['section'], $row['country'] ) : wm_country_url( $row['country'] );
		}
		$out[] = array(
			'key'   => (string) $key,
			'label' => $label,
			'count' => $g['count'],
			'ids'   => $g['ids'],
			'url'   => $url,
		);
	}

	if ( 'section' === $by ) {
		$order = array_flip( array_keys( $sections ) );
		usort( $out, static fn( $a, $b ) => ( $order[ $a['key'] ] ?? 99 ) <=> ( $order[ $b['key'] ] ?? 99 ) );
	} else {
		usort( $out, static fn( $a, $b ) => array( $b['count'], $a['label'] ) <=> array( $a['count'], $b['label'] ) );
	}
	return $out;
}

/**
 * Offers grouped by the place they sit in (city name, or the country itself
 * for country-wide products). Kept for callers that already hold posts.
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

/** The lowest listed price of an offer, formatted ("from €16.35"), or '' when the data gave none. */
function wm_offer_price_from( int $post_id ): string {
	$amount   = (float) get_post_meta( $post_id, 'wm_price_from', true );
	$currency = strtoupper( (string) get_post_meta( $post_id, 'wm_currency', true ) );
	if ( $amount <= 0 || ! preg_match( '/^[A-Z]{3}$/', $currency ) ) {
		return '';
	}
	$symbols = array(
		'EUR' => '€',
		'GBP' => '£',
		'USD' => 'US$',
		'JPY' => '¥',
	);
	$number = number_format( $amount, 2 );
	return 'from ' . ( isset( $symbols[ $currency ] ) ? $symbols[ $currency ] . $number : $number . ' ' . $currency );
}
