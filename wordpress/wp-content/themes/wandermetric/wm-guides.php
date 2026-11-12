<?php
/**
 * All guides: a reading list, newest first. Each row names the place, the
 * question, the answer in a line, and when its facts were checked.
 */

defined( 'ABSPATH' ) || exit;
get_header();
$guides = wm_get_guides();
?>
<section class="guides-head wrap">
	<?php wm_breadcrumbs( array( array( 'Home', home_url( '/' ) ), array( 'Guides', null ) ) ); ?>
	<h1><?php esc_html_e( 'Travel guides', 'wandermetric' ); ?></h1>
	<p class="guide-standfirst"><?php esc_html_e( 'The questions people ask before they book, answered from official sources. Every guide lists its sources and the day each was read.', 'wandermetric' ); ?></p>
</section>

<section class="wrap guides-index" aria-label="<?php esc_attr_e( 'Guides', 'wandermetric' ); ?>">
	<?php if ( $guides ) : ?>
		<ul class="guide-list">
			<?php
			foreach ( $guides as $g ) {
				wm_guide_row( $g );
			}
			?>
		</ul>
	<?php else : ?>
		<p class="empty"><?php esc_html_e( 'No guides published yet.', 'wandermetric' ); ?></p>
	<?php endif; ?>
</section>
<?php
get_footer();
