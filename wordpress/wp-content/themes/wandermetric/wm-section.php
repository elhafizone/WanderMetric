<?php
/**
 * /{section}/ : one of the ten sections. The places with the most offers get a
 * rail each; every other place is in the index below. Country filters lead.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$slug    = (string) get_query_var( 'wm_s' );
$section = wm_sections()[ $slug ];
$groups  = wm_offer_groups( array( 'section' => $slug ), 'place' );

$filters = array( array( 'All', wm_section_url( $slug ), true ) );
foreach ( wm_top_countries( 12, array( 'section' => $slug ) ) as $c ) {
	$filters[] = array( $c['term']->name, wm_section_url( $slug, $c['term']->slug ), false );
}

get_template_part(
	'template-parts/listing',
	null,
	array(
		'title'       => $section['name'],
		'lede'        => $section['tagline'] . '.',
		'photo'       => null,
		'trail'       => array( array( 'Home', home_url( '/' ) ), array( $section['name'], null ) ),
		'groups'      => $groups,
		'per_group'   => 4,
		'max_groups'  => 8,
		'index_title' => sprintf( '%s in %d more places', $section['name'], max( 0, count( $groups ) - 8 ) ),
		'filters'     => count( $filters ) > 2 ? $filters : array(),
		'empty'       => 'No partner in this section yet. We only list what we have read.',
		'widget'      => wm_widget_slot( 'section:' . $slug ),
	)
);

get_footer();
