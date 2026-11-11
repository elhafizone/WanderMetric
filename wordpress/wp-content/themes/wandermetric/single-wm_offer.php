<?php
/**
 * An offer: place first, then the partner photo, the facts as read, the tip,
 * the original text, and the way out to the partner (always through /go/).
 */

defined( 'ABSPATH' ) || exit;
get_header();

while ( have_posts() ) :
	the_post();
	$offer    = get_post();
	$sections = wm_sections();
	$section  = wm_offer_section( $offer->ID );
	$place    = wm_offer_place( $offer->ID );
	$facts    = wm_offer_facts( $offer->ID );
	$partner  = wm_programme_name( (string) get_post_meta( $offer->ID, 'wm_programme', true ) );
	$read_on  = wm_offer_read_on( $offer->ID );
	$price    = (string) get_post_meta( $offer->ID, 'wm_price_note', true );
	$tip      = (string) get_post_meta( $offer->ID, 'wm_tip', true );
	$credit   = (string) get_post_meta( $offer->ID, 'wm_image_credit', true );
	$source   = (string) get_post_meta( $offer->ID, 'wm_source_url', true );
	$country  = $place['country'];

	$trail = array();
	if ( $section ) {
		$trail[] = array( $sections[ $section ]['name'], wm_section_url( $section ) );
		if ( $country ) {
			$trail[] = array( $country->name, wm_section_url( $section, $country->slug ) );
		}
	}
	$trail[] = array( get_the_title(), null );

	// Rating and provider-style keys are shown in the aside, not the main table.
	$key_facts = array_intersect_key( $facts, array_flip( array( 'meeting_point', 'departs_from', 'duration_minutes', 'opening_hours', 'cancellation', 'ticket_delivery', 'network', 'plan_type' ) ) );
	?>
<article class="offer">
	<header class="offer-head wrap">
		<?php wm_breadcrumbs( $trail ); ?>
		<p class="offer-place"><?php echo esc_html( wm_offer_place_label( $offer ) ); ?></p>
		<h1><?php the_title(); ?></h1>
		<?php if ( has_excerpt() ) : ?>
			<p class="offer-summary"><?php echo esc_html( get_the_excerpt() ); ?></p>
		<?php endif; ?>
	</header>

	<div class="offer-media wrap">
		<?php
		$img = wm_offer_image( $offer, 'large', '(min-width: 64rem) 66vw, 100vw', true );
		if ( $img ) {
			echo '<figure>' . $img . ( $credit ? '<figcaption class="photo-credit">Photo: ' . esc_html( $credit ) . '</figcaption>' : '' ) . '</figure>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		?>
	</div>

	<div class="offer-body wrap">
		<div class="offer-main">
			<?php if ( $tip ) : ?>
				<aside class="tip">
					<h2>Before you go</h2>
					<p><?php echo esc_html( $tip ); ?></p>
					<?php if ( $read_on ) : ?><small>From the <?php echo esc_html( $partner ); ?> listing, read <?php echo esc_html( $read_on ); ?></small><?php endif; ?>
				</aside>
			<?php endif; ?>

			<?php if ( $facts ) : ?>
				<section class="facts" aria-labelledby="facts-h">
					<h2 id="facts-h">As listed on <?php echo esc_html( $partner ); ?></h2>
					<dl>
						<?php foreach ( $facts as $key => $value ) : ?>
							<?php if ( '' === $value || null === $value || array() === $value ) { continue; } ?>
							<div><dt><?php echo esc_html( wm_fact_label( (string) $key ) ); ?></dt><dd><?php echo wm_fact_value( 'duration_minutes' === $key ? $value . ' min' : $value ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></dd></div>
						<?php endforeach; ?>
					</dl>
				</section>
			<?php endif; ?>

			<div class="prose">
				<?php the_content(); ?>
			</div>
		</div>

		<aside class="offer-aside" aria-label="Book">
			<div class="book">
				<?php if ( $read_on ) : ?>
					<p class="stamp">Read on <?php echo esc_html( $partner ); ?> · <?php echo esc_html( $read_on ); ?></p>
				<?php endif; ?>
				<?php if ( $price ) : ?>
					<p class="book-price"><?php echo esc_html( $price ); ?></p>
				<?php endif; ?>
				<?php if ( $key_facts ) : ?>
					<ul class="book-facts">
						<?php foreach ( $key_facts as $key => $value ) : ?>
							<?php if ( is_scalar( $value ) && '' !== $value ) : ?>
								<li><span><?php echo esc_html( wm_fact_label( (string) $key ) ); ?></span> <?php echo esc_html( 'duration_minutes' === $key ? $value . ' min' : (string) $value ); ?></li>
							<?php endif; ?>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
				<a class="btn" href="<?php echo esc_url( wm_go_url( $offer ) ); ?>" rel="sponsored nofollow noopener" target="_blank">Check availability on <?php echo esc_html( $partner ); ?></a>
				<p class="book-note">Affiliate link. The price and availability are set by <?php echo esc_html( $partner ); ?>.<?php if ( $source ) : ?> <a href="<?php echo esc_url( $source ); ?>" rel="nofollow noopener" target="_blank">Listing we read</a>.<?php endif; ?></p>
			</div>
		</aside>
	</div>

	<?php
	$related = $place['city']
		? wm_get_offers( array( 'city' => $place['city']->slug, 'limit' => 4, 'exclude' => array( $offer->ID ) ) )
		: ( $country ? wm_get_offers( array( 'country' => $country->slug, 'limit' => 4, 'exclude' => array( $offer->ID ) ) ) : array() );
	if ( $related ) :
		$where = $place['city'] ? $place['city']->name : $country->name;
		?>
		<section class="rail wrap" aria-label="<?php echo esc_attr( 'More in ' . $where ); ?>">
			<div class="rail-head"><h2>More in <?php echo esc_html( $where ); ?></h2></div>
			<div class="rail-grid">
				<?php
				foreach ( $related as $r ) {
					wm_offer_card( $r );
				}
				?>
			</div>
		</section>
	<?php endif; ?>
</article>
	<?php
endwhile;
get_footer();
