<?php
/**
 * /countries/ : the atlas of every country with offers, its cities beneath.
 */

defined( 'ABSPATH' ) || exit;
get_header();
?>
<header class="place-head">
	<div class="place-text wrap">
		<?php wm_breadcrumbs( array( array( 'Home', home_url( '/' ) ), array( 'Destinations', null ) ) ); ?>
		<h1>Destinations</h1>
		<p>Every country we have read listings for. Pick a place to see what to book there.</p>
	</div>
</header>
<ul class="countries wrap">
	<?php foreach ( wm_countries_with_offers() as $c ) : ?>
		<?php
		$photo  = wm_place_photo( $c->slug );
		$cities = get_terms( array( 'taxonomy' => 'wm_place', 'parent' => $c->term_id, 'hide_empty' => false ) );
		$count  = wm_count_offers( array( 'country' => $c->slug ) );
		?>
		<li class="country">
			<a class="country-link" href="<?php echo esc_url( wm_country_url( $c->slug ) ); ?>">
				<?php
				if ( $photo ) {
					wm_photo( $photo, '(min-width: 64rem) 33vw, 100vw', false, '', true );
				}
				?>
				<span class="country-name"><?php echo esc_html( $c->name ); ?></span>
			</a>
			<p class="country-meta"><?php echo esc_html( sprintf( _n( '%d offer', '%d offers', $count, 'wandermetric' ), $count ) ); ?>
			<?php
			$links = array();
			foreach ( is_array( $cities ) ? $cities : array() as $city ) {
				if ( wm_count_offers( array( 'city' => $city->slug ) ) ) {
					$links[] = '<a href="' . esc_url( wm_country_url( $c->slug, $city->slug ) ) . '">' . esc_html( $city->name ) . '</a>';
				}
			}
			echo $links ? ' · ' . implode( ', ', $links ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			?>
			</p>
		</li>
	<?php endforeach; ?>
</ul>
<?php
get_footer();
