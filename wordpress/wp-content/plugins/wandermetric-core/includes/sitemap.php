<?php
/**
 * Sitemaps: core lists the offers; this provider adds the section, section+country,
 * country and city pages. Pages under the noindex threshold are left out, as are
 * users, categories and the raw taxonomy archives (?wm_place=…), which are not routes.
 */

defined( 'ABSPATH' ) || exit;

/** Term links point at the real routes, never at ?wm_section= / ?wm_place= archives. */
add_filter(
	'term_link',
	static function ( string $link, WP_Term $term, string $taxonomy ) {
		if ( 'wm_section' === $taxonomy ) {
			return wm_section_url( $term->slug );
		}
		if ( 'wm_place' === $taxonomy ) {
			if ( ! $term->parent ) {
				return wm_country_url( $term->slug );
			}
			$country = get_term( $term->parent, 'wm_place' );
			return $country instanceof WP_Term ? wm_country_url( $country->slug, $term->slug ) : $link;
		}
		return $link;
	},
	10,
	3
);

/** Someone landing on a raw taxonomy archive is sent to the real page. */
add_action(
	'template_redirect',
	static function () {
		if ( is_tax( array( 'wm_section', 'wm_place' ) ) ) {
			$term = get_queried_object();
			if ( $term instanceof WP_Term ) {
				wp_safe_redirect( get_term_link( $term ), 301 );
				exit;
			}
		}
	}
);

add_filter(
	'wp_sitemaps_taxonomies',
	static function ( array $taxonomies ) {
		unset( $taxonomies['wm_section'], $taxonomies['wm_place'], $taxonomies['category'], $taxonomies['post_tag'] );
		return $taxonomies;
	}
);

add_filter(
	'wp_sitemaps_add_provider',
	static fn( $provider, string $name ) => 'users' === $name ? false : $provider,
	10,
	2
);

add_action(
	'init',
	static function () {
		if ( ! class_exists( 'WP_Sitemaps_Provider' ) ) {
			return;
		}

		/** Section and destination pages. */
		final class WM_Sitemaps_Places extends WP_Sitemaps_Provider {
			public function __construct() {
				$this->name        = 'wm';
				$this->object_type = 'routes';
			}

			public function get_url_list( $page_num, $object_subtype = '' ) {
				if ( 1 !== (int) $page_num ) {
					return array();
				}
				$urls = array();
				$min  = WM_MIN_OFFERS_FOR_COUNTRY_PAGE;
				$urls[] = array( 'loc' => home_url( user_trailingslashit( 'countries' ) ) );
				foreach ( array_keys( wm_sections() ) as $section ) {
					if ( wm_count_offers( array( 'section' => $section ) ) ) {
						$urls[] = array( 'loc' => wm_section_url( $section ) );
					}
				}
				foreach ( wm_countries_with_offers() as $country ) {
					if ( wm_count_offers( array( 'country' => $country->slug ) ) >= $min ) {
						$urls[] = array( 'loc' => wm_country_url( $country->slug ) );
					}
					foreach ( array_keys( wm_sections() ) as $section ) {
						if ( wm_count_offers( array( 'section' => $section, 'country' => $country->slug ) ) >= $min ) {
							$urls[] = array( 'loc' => wm_section_url( $section, $country->slug ) );
						}
					}
					$cities = get_terms( array( 'taxonomy' => 'wm_place', 'parent' => $country->term_id, 'hide_empty' => false ) );
					foreach ( is_array( $cities ) ? $cities : array() as $city ) {
						if ( wm_count_offers( array( 'city' => $city->slug ) ) >= $min ) {
							$urls[] = array( 'loc' => wm_country_url( $country->slug, $city->slug ) );
						}
					}
				}
				return $urls;
			}

			public function get_max_num_pages( $object_subtype = '' ) {
				return 1;
			}
		}

		wp_register_sitemap_provider( 'wm', new WM_Sitemaps_Places() );
	},
	30
);
