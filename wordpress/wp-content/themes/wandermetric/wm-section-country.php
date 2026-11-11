<?php
/**
 * /{section}/{country}/ : a section filtered to one country.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$slug    = (string) get_query_var( 'wm_s' );
$section = wm_sections()[ $slug ];
$country = wm_get_country( (string) get_query_var( 'wm_country' ) );
$offers  = wm_get_offers( array( 'section' => $slug, 'country' => $country->slug ) );

$filters = array( array( 'All', wm_section_url( $slug ), false ) );
foreach ( wm_countries_with_offers() as $c ) {
	if ( wm_count_offers( array( 'section' => $slug, 'country' => $c->slug ) ) ) {
		$filters[] = array( $c->name, wm_section_url( $slug, $c->slug ), $c->slug === $country->slug );
	}
}

get_template_part(
	'template-parts/listing',
	null,
	array(
		'title'    => $section['name'] . ' in ' . $country->name,
		'lede'     => $section['tagline'] . '.',
		'photo'    => wm_place_photo( $country->slug ),
		'trail'    => array( array( 'Home', home_url( '/' ) ), array( $section['name'], wm_section_url( $slug ) ), array( $country->name, null ) ),
		'offers'   => $offers,
		'group_by' => 'place',
		'filters'  => $filters,
		'empty'    => 'Nothing in ' . $country->name . ' for this section yet.',
	)
);

get_footer();
