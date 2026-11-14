<?php
/**
 * /countries/{country}/{city}/ : one city, a rail per section with every offer.
 * Country-wide products (eSIMs, insurance) for the country are listed after.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$country = wm_get_country( (string) get_query_var( 'wm_country' ) );
$city    = wm_get_city( $country->slug, (string) get_query_var( 'wm_city' ) );

get_template_part(
	'template-parts/listing',
	null,
	array(
		'title'  => $city->name,
		'lede'   => 'What to book in ' . $city->name . ', read from each partner’s listing or its own data.',
		'photo'  => wm_place_photo( $city->slug ),
		'trail'  => array( array( 'Home', home_url( '/' ) ), array( $country->name, wm_country_url( $country->slug ) ), array( $city->name, null ) ),
		'groups' => wm_offer_groups( array( 'city' => $city->slug ), 'section' ),
		'widget' => wm_widget_slot( 'city:' . $city->slug ),
		'empty'  => 'No offers in ' . $city->name . ' yet.',
	)
);

$wide = wm_get_offers( array( 'country' => $country->slug, 'wide' => true, 'limit' => 8 ) );
if ( $wide ) :
	?>
	<section class="rail wrap" aria-label="<?php echo esc_attr( 'Across ' . $country->name ); ?>">
		<div class="rail-head"><h2>Across <?php echo esc_html( $country->name ); ?></h2><p>Country-wide, also useful in <?php echo esc_html( $city->name ); ?>.</p></div>
		<div class="rail-grid">
			<?php
			foreach ( $wide as $o ) {
				wm_offer_card( $o );
			}
			?>
		</div>
	</section>
	<?php
endif;

get_footer();
