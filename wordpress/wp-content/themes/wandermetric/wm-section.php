<?php
/**
 * /{section}/ : one of the ten sections, grouped by place, with country filters.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$slug    = (string) get_query_var( 'wm_s' );
$section = wm_sections()[ $slug ];
$offers  = wm_get_offers( array( 'section' => $slug ) );

$filters = array( array( 'All', wm_section_url( $slug ), true ) );
foreach ( wm_countries_with_offers() as $c ) {
	if ( wm_count_offers( array( 'section' => $slug, 'country' => $c->slug ) ) ) {
		$filters[] = array( $c->name, wm_section_url( $slug, $c->slug ), false );
	}
}

get_template_part(
	'template-parts/listing',
	null,
	array(
		'title'    => $section['name'],
		'lede'     => $section['tagline'] . '.',
		'photo'    => null,
		'trail'    => array( array( 'Home', home_url( '/' ) ), array( $section['name'], null ) ),
		'offers'   => $offers,
		'group_by' => 'place',
		'filters'  => count( $filters ) > 2 ? $filters : array(),
		'empty'    => 'No partner in this section yet. We only list what we have read.',
		'widget'   => wm_widget_slot( 'section:' . $slug ),
	)
);

get_footer();
