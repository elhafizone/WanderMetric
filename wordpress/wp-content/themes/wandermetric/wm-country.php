<?php
/**
 * /countries/{country}/ : everything for one country, a rail per section, with its cities.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$country = wm_get_country( (string) get_query_var( 'wm_country' ) );
$counts  = wm_place_counts( array( 'country' => $country->slug ) )['city'];
arsort( $counts );
$names = wm_place_names();

$filters = array( array( 'All of ' . $country->name, wm_country_url( $country->slug ), true ) );
foreach ( array_slice( $counts, 0, 15, true ) as $city => $n ) {
	$filters[] = array( $names[ $city ] ?? $city, wm_country_url( $country->slug, (string) $city ), false );
}

get_template_part(
	'template-parts/listing',
	null,
	array(
		'title'     => $country->name,
		'lede'      => 'Tickets, transfers, eSIMs and more for ' . $country->name . ', each read from the partner’s listing or its own data.',
		'photo'     => wm_place_photo( $country->slug ),
		'trail'     => array( array( 'Home', home_url( '/' ) ), array( 'Destinations', home_url( '/countries/' ) ), array( $country->name, null ) ),
		'groups'    => wm_offer_groups( array( 'country' => $country->slug ), 'section' ),
		'per_group' => 8,
		'widget'    => wm_widget_slot( 'country:' . $country->slug ),
		'filters'   => count( $filters ) > 1 ? $filters : array(),
		'empty'     => 'No offers in ' . $country->name . ' yet.',
	)
);

if ( count( $counts ) > 15 ) :
	?>
	<section class="place-index wrap" aria-labelledby="cities-h">
		<h2 id="cities-h">Every city in <?php echo esc_html( $country->name ); ?></h2>
		<ul>
			<?php foreach ( $counts as $city => $n ) : ?>
				<li><a href="<?php echo esc_url( wm_country_url( $country->slug, (string) $city ) ); ?>"><span><?php echo esc_html( $names[ $city ] ?? $city ); ?></span> <span class="place-index-n"><?php echo (int) $n; ?></span></a></li>
			<?php endforeach; ?>
		</ul>
	</section>
	<?php
endif;

get_footer();
