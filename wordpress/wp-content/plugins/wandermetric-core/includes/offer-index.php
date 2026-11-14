<?php
/**
 * One index of every published offer: its section, place, tier and sort weight.
 *
 * Built with four queries (posts, terms, places, two meta keys) and cached
 * until an offer, its terms or its tier change, so section, country and city
 * pages, the sitemap and the footer can count and group a thousand offers
 * without loading a single post. Rows are stored in display order: editorial
 * offers first, then catalogue offers by weight, newest first within each.
 */

defined( 'ABSPATH' ) || exit;

const WM_OFFER_INDEX_KEY = 'wm_offer_index_v1';

/**
 * @return array<int, array{section: string, country: string, city: string, tier: string, weight: int}>
 */
function wm_offer_index(): array {
	if ( isset( $GLOBALS['wm_offer_index'] ) ) {
		return $GLOBALS['wm_offer_index'];
	}
	$cached = get_transient( WM_OFFER_INDEX_KEY );
	if ( is_array( $cached ) ) {
		$GLOBALS['wm_offer_index'] = $cached;
		return $cached;
	}

	global $wpdb;
	$posts = $wpdb->get_results( "SELECT ID, post_date FROM {$wpdb->posts} WHERE post_type = 'wm_offer' AND post_status = 'publish'" );
	$rows  = array();
	foreach ( $posts as $p ) {
		$rows[ (int) $p->ID ] = array(
			'section' => '',
			'country' => '',
			'city'    => '',
			'tier'    => 'editorial',
			'weight'  => 0,
			'date'    => (string) $p->post_date,
		);
	}

	if ( $rows ) {
		// Place terms by ID, so a city resolves to its country without more queries.
		$places = array();
		foreach ( (array) get_terms( array( 'taxonomy' => 'wm_place', 'hide_empty' => false ) ) as $t ) {
			if ( $t instanceof WP_Term ) {
				$places[ (int) $t->term_id ] = $t;
			}
		}
		$terms = $wpdb->get_results(
			"SELECT tr.object_id, tt.taxonomy, tt.term_id, t.slug
			   FROM {$wpdb->term_relationships} tr
			   JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
			   JOIN {$wpdb->terms} t ON t.term_id = tt.term_id
			   JOIN {$wpdb->posts} p ON p.ID = tr.object_id
			  WHERE p.post_type = 'wm_offer' AND p.post_status = 'publish'
			    AND tt.taxonomy IN ('wm_section', 'wm_place')"
		);
		foreach ( $terms as $t ) {
			$id = (int) $t->object_id;
			if ( ! isset( $rows[ $id ] ) ) {
				continue;
			}
			if ( 'wm_section' === $t->taxonomy ) {
				$rows[ $id ]['section'] = (string) $t->slug;
				continue;
			}
			$term = $places[ (int) $t->term_id ] ?? null;
			if ( ! $term ) {
				continue;
			}
			if ( $term->parent && isset( $places[ (int) $term->parent ] ) ) {
				$rows[ $id ]['city']    = $term->slug;
				$rows[ $id ]['country'] = $places[ (int) $term->parent ]->slug;
			} else {
				$rows[ $id ]['country'] = $term->slug;
			}
		}

		$meta = $wpdb->get_results(
			"SELECT m.post_id, m.meta_key, m.meta_value
			   FROM {$wpdb->postmeta} m
			   JOIN {$wpdb->posts} p ON p.ID = m.post_id
			  WHERE p.post_type = 'wm_offer' AND p.post_status = 'publish'
			    AND m.meta_key IN ('wm_tier', 'wm_weight')"
		);
		foreach ( $meta as $m ) {
			$id = (int) $m->post_id;
			if ( ! isset( $rows[ $id ] ) ) {
				continue;
			}
			if ( 'wm_tier' === $m->meta_key && 'catalogue' === $m->meta_value ) {
				$rows[ $id ]['tier'] = 'catalogue';
			} elseif ( 'wm_weight' === $m->meta_key ) {
				$rows[ $id ]['weight'] = (int) $m->meta_value;
			}
		}

		uksort(
			$rows,
			static function ( int $a, int $b ) use ( $rows ): int {
				$x = $rows[ $a ];
				$y = $rows[ $b ];
				return array( 'catalogue' === $x['tier'], -$x['weight'], $y['date'], $b ) <=> array( 'catalogue' === $y['tier'], -$y['weight'], $x['date'], $a );
			}
		);
	}

	set_transient( WM_OFFER_INDEX_KEY, $rows, 12 * HOUR_IN_SECONDS );
	$GLOBALS['wm_offer_index'] = $rows;
	return $rows;
}

function wm_offer_index_flush(): void {
	unset( $GLOBALS['wm_offer_index'] );
	delete_transient( WM_OFFER_INDEX_KEY );
}

add_action(
	'save_post_wm_offer',
	static function () {
		wm_offer_index_flush();
	}
);
add_action(
	'transition_post_status',
	static function ( string $new, string $old, WP_Post $post ) {
		if ( 'wm_offer' === $post->post_type && $new !== $old ) {
			wm_offer_index_flush();
		}
	},
	10,
	3
);
add_action(
	'deleted_post',
	static function ( int $post_id, $post = null ) {
		if ( $post instanceof WP_Post && 'wm_offer' === $post->post_type ) {
			wm_offer_index_flush();
		}
	},
	10,
	2
);
add_action(
	'set_object_terms',
	static function ( int $object_id, $terms, $tt_ids, string $taxonomy ) {
		if ( in_array( $taxonomy, array( 'wm_section', 'wm_place' ), true ) ) {
			wm_offer_index_flush();
		}
	},
	10,
	4
);
foreach ( array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ) as $wm_meta_hook ) {
	add_action(
		$wm_meta_hook,
		static function ( $meta_id, $post_id, string $key ) {
			if ( in_array( $key, array( 'wm_tier', 'wm_weight' ), true ) ) {
				wm_offer_index_flush();
			}
		},
		10,
		3
	);
}
foreach ( array( 'created_wm_place', 'edited_wm_place', 'delete_wm_place' ) as $wm_term_hook ) {
	add_action( $wm_term_hook, 'wm_offer_index_flush' );
}

/** An offer's tier: 'editorial' (written by hand, indexed) or 'catalogue' (built from partner data, noindex). */
function wm_offer_tier( int $post_id ): string {
	return 'catalogue' === get_post_meta( $post_id, 'wm_tier', true ) ? 'catalogue' : 'editorial';
}

/**
 * Does an index row match a filter?
 *
 * @param array{section?: string, country?: string, city?: string, tier?: string, wide?: bool} $filter
 *   `wide`: only offers filed on the country itself (eSIMs, insurance), not on one of its cities.
 */
function wm_offer_row_matches( array $row, array $filter ): bool {
	if ( ! empty( $filter['section'] ) && $row['section'] !== $filter['section'] ) {
		return false;
	}
	if ( ! empty( $filter['city'] ) ) {
		if ( $row['city'] !== $filter['city'] ) {
			return false;
		}
	} elseif ( ! empty( $filter['country'] ) && $row['country'] !== $filter['country'] ) {
		return false;
	}
	if ( ! empty( $filter['tier'] ) && $row['tier'] !== $filter['tier'] ) {
		return false;
	}
	if ( ! empty( $filter['wide'] ) && '' !== $row['city'] ) {
		return false;
	}
	return true;
}

/**
 * Offer IDs in display order.
 *
 * @param array{section?: string, country?: string, city?: string, tier?: string, wide?: bool, limit?: int, exclude?: int[]} $filter
 * @return int[]
 */
function wm_offer_ids( array $filter = array() ): array {
	$exclude = array_flip( array_map( 'intval', (array) ( $filter['exclude'] ?? array() ) ) );
	$limit   = (int) ( $filter['limit'] ?? -1 );
	$out     = array();
	foreach ( wm_offer_index() as $id => $row ) {
		if ( isset( $exclude[ $id ] ) || ! wm_offer_row_matches( $row, $filter ) ) {
			continue;
		}
		$out[] = $id;
		if ( $limit > 0 && count( $out ) >= $limit ) {
			break;
		}
	}
	return $out;
}

/**
 * Published offers per country and per city among those matching a filter.
 *
 * @return array{country: array<string, int>, city: array<string, int>, wide: array<string, int>}
 */
function wm_place_counts( array $filter = array() ): array {
	$out = array(
		'country' => array(),
		'city'    => array(),
		'wide'    => array(),
	);
	foreach ( wm_offer_index() as $row ) {
		if ( ! wm_offer_row_matches( $row, $filter ) || '' === $row['country'] ) {
			continue;
		}
		$out['country'][ $row['country'] ] = ( $out['country'][ $row['country'] ] ?? 0 ) + 1;
		if ( '' !== $row['city'] ) {
			$out['city'][ $row['city'] ] = ( $out['city'][ $row['city'] ] ?? 0 ) + 1;
		} else {
			$out['wide'][ $row['country'] ] = ( $out['wide'][ $row['country'] ] ?? 0 ) + 1;
		}
	}
	return $out;
}
