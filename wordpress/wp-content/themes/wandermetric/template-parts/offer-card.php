<?php
/**
 * Offer card: the partner photograph, the place, the title, the partner.
 * No frame, fill or shadow; the photo carries the card.
 *
 * @var array{offer: WP_Post, variant: string} $args
 */

defined( 'ABSPATH' ) || exit;

$offer   = $args['offer'];
$variant = $args['variant'] ?? '';
// Decorative: the card's title already names the link.
$image   = wm_offer_image( $offer, 'medium_large', 'large' === $variant ? '(min-width: 64rem) 50vw, 100vw' : '(min-width: 64rem) 25vw, (min-width: 40rem) 50vw, 100vw', false, true );
$partner = wm_programme_name( (string) get_post_meta( $offer->ID, 'wm_programme', true ) );
?>
<article class="card <?php echo $variant ? 'card--' . esc_attr( $variant ) : ''; ?>">
	<a class="card-link" href="<?php echo esc_url( get_permalink( $offer ) ); ?>">
		<div class="card-media<?php echo $image ? '' : ' card-media--empty'; ?>">
			<?php
			// wp_get_attachment_image output is already escaped.
			// Without a partner photo the card shows the place name in type: never a borrowed photo.
			$place = wm_offer_place( $offer->ID );
			$name  = $place['city'] ? $place['city']->name : ( $place['country'] ? $place['country']->name : '' );
			echo $image ? $image : '<span class="card-type" aria-hidden="true">' . esc_html( $name ) . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			?>
		</div>
		<p class="card-place"><?php echo esc_html( wm_offer_place_label( $offer ) ); ?></p>
		<h3 class="card-title"><?php echo esc_html( get_the_title( $offer ) ); ?></h3>
		<p class="card-partner"><?php echo esc_html( sprintf( /* translators: partner name */ __( 'On %s', 'wandermetric' ), $partner ) ); ?></p>
	</a>
</article>
