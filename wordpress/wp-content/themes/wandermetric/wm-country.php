<?php
/**
 * /countries/{country}/ : everything for one country, grouped by section, with its cities.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$country = wm_get_country( (string) get_query_var( 'wm_country' ) );
$offers  = wm_get_offers( array( 'country' => $country->slug ) );
$cities  = get_terms( array( 'taxonomy' => 'wm_place', 'parent' => $country->term_id, 'hide_empty' => false ) );

$filters = array( array( 'All of ' . $country->name, wm_country_url( $country->slug ), true ) );
foreach ( is_array( $cities ) ? $cities : array() as $city ) {
	if ( wm_count_offers( array( 'city' => $city->slug ) ) ) {
		$filters[] = array( $city->name, wm_country_url( $country->slug, $city->slug ), false );
	}
}

get_template_part(
	'template-parts/listing',
	null,
	array(
		'title'    => $country->name,
		'lede'     => 'Tickets, transfers, eSIMs and more for ' . $country->name . ', each read from the partner’s listing.',
		'photo'    => wm_place_photo( $country->slug ),
		'trail'    => array( array( 'Home', home_url( '/' ) ), array( 'Destinations', home_url( '/countries/' ) ), array( $country->name, null ) ),
		'offers'   => $offers,
		'group_by' => 'section',
		'widget'   => wm_widget_slot( 'country:' . $country->slug ),
		'filters'  => count( $filters ) > 1 ? $filters : array(),
		'empty'    => 'No offers in ' . $country->name . ' yet.',
	)
);

get_footer();
