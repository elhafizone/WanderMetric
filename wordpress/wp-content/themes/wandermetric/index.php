<?php
/**
 * Fallback: the news archive (/news), search results, anything else.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$is_news = is_home();
?>
<header class="place-head">
	<div class="place-text wrap">
		<?php if ( $is_news ) : ?>
			<?php wm_breadcrumbs( array( array( 'Home', home_url( '/' ) ), array( 'News', null ) ) ); ?>
			<h1>Travel news</h1>
			<p>Dated reports on changes that affect a trip. Every story says when it was published and where the facts came from.</p>
		<?php elseif ( is_search() ) : ?>
			<h1><?php echo esc_html( sprintf( 'Results for “%s”', get_search_query() ) ); ?></h1>
		<?php else : ?>
			<h1><?php echo esc_html( wp_strip_all_tags( get_the_archive_title() ) ); ?></h1>
		<?php endif; ?>
	</div>
</header>
<?php if ( have_posts() ) : ?>
	<div class="rail wrap"><div class="rail-grid">
		<?php
		while ( have_posts() ) {
			the_post();
			if ( 'wm_offer' === get_post_type() ) {
				wm_offer_card( get_post() );
				continue;
			}
			printf(
				'<article class="card"><a class="card-link" href="%s"><p class="card-place">%s</p><h3 class="card-title">%s</h3><p class="card-partner">%s</p></a></article>',
				esc_url( get_permalink() ),
				esc_html( get_the_date( 'j F Y' ) ),
				esc_html( get_the_title() ),
				esc_html( wp_trim_words( get_the_excerpt(), 20, '…' ) )
			);
		}
		?>
	</div></div>
	<div class="wrap"><?php the_posts_pagination( array( 'mid_size' => 1 ) ); ?></div>
<?php elseif ( $is_news ) : ?>
	<div class="empty wrap">
		<p><strong>No news published yet.</strong> Stories appear here once a dated report has been written and reviewed. Browse the <a href="<?php echo esc_url( home_url( '/countries' ) ); ?>">destinations</a> and offers in the meantime.</p>
		<p>News is written independently of our partners. Links to bookable offers live on the offer pages, not inside news stories.</p>
	</div>
<?php else : ?>
	<p class="empty wrap"><?php esc_html_e( 'Nothing matched. Try a city, a landmark or a kind of ticket.', 'wandermetric' ); ?></p>
<?php endif; ?>
<?php
get_footer();
