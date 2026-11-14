<?php
/**
 * /{section}/{country}/ : a section filtered to one country, a rail per city.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$slug    = (string) get_query_var( 'wm_s' );
$section = wm_sections()[ $slug ];
$country = wm_get_country( (string) get_query_var( 'wm_country' ) );
$groups  = wm_offer_groups( array( 'section' => $slug, 'country' => $country->slug ), 'place' );

$filters = array( array( 'All', wm_section_url( $slug ), false ) );
$listed  = false;
foreach ( wm_top_countries( 12, array( 'section' => $slug ) ) as $c ) {
	$current   = $c['term']->slug === $country->slug;
	$listed    = $listed || $current;
	$filters[] = array( $c['term']->name, wm_section_url( $slug, $c['term']->slug ), $current );
}
if ( ! $listed ) {
	$filters[] = array( $country->name, wm_section_url( $slug, $country->slug ), true );
}

get_template_part(
	'template-parts/listing',
	null,
	array(
		'title'       => $section['name'] . ' in ' . $country->name,
		'lede'        => $section['tagline'] . '.',
		'photo'       => wm_place_photo( $country->slug ),
		'trail'       => array( array( 'Home', home_url( '/' ) ), array( $section['name'], wm_section_url( $slug ) ), array( $country->name, null ) ),
		'groups'      => $groups,
		'per_group'   => 4,
		'max_groups'  => 12,
		'index_title' => 'More places in ' . $country->name,
		'filters'     => $filters,
		'widget'      => wm_widget_for( 'country:' . $country->slug ) ? wm_widget_slot( 'country:' . $country->slug ) : wm_widget_slot( 'section:' . $slug ),
		'empty'       => 'Nothing in ' . $country->name . ' for this section yet.',
	)
);

get_footer();
