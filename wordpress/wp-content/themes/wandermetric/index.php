<?php
/**
 * Fallback and search results.
 */

defined( 'ABSPATH' ) || exit;
get_header();
?>
<header class="place-head">
	<div class="place-text wrap">
		<h1><?php echo is_search() ? esc_html( sprintf( 'Results for “%s”', get_search_query() ) ) : esc_html( wp_get_document_title() ); ?></h1>
	</div>
</header>
<?php if ( have_posts() ) : ?>
	<div class="rail wrap"><div class="rail-grid">
		<?php
		while ( have_posts() ) {
			the_post();
			if ( 'wm_offer' === get_post_type() ) {
				wm_offer_card( get_post() );
			} else {
				echo '<article class="card"><h3 class="card-title"><a href="' . esc_url( get_permalink() ) . '">' . esc_html( get_the_title() ) . '</a></h3></article>';
			}
		}
		?>
	</div></div>
<?php else : ?>
	<p class="empty wrap"><?php esc_html_e( 'Nothing matched. Try a city, a landmark or a kind of ticket.', 'wandermetric' ); ?></p>
<?php endif; ?>
<?php
get_footer();
