<?php
/**
 * A news story: dated, with where the facts came from in the text.
 */

defined( 'ABSPATH' ) || exit;
get_header();

while ( have_posts() ) :
	the_post();
	?>
<article class="page">
	<header class="place-head">
		<div class="place-text wrap">
			<?php wm_breadcrumbs( array( array( 'Home', home_url( '/' ) ), array( 'News', get_permalink( (int) get_option( 'page_for_posts' ) ) ), array( get_the_title(), null ) ) ); ?>
			<h1><?php the_title(); ?></h1>
			<?php if ( has_excerpt() ) : ?><p><?php echo esc_html( get_the_excerpt() ); ?></p><?php endif; ?>
		</div>
	</header>
	<div class="wrap page-body">
		<div class="prose"><?php the_content(); ?></div>
		<p class="page-updated">Published <?php echo esc_html( get_the_date( 'j F Y' ) ); ?> · Last updated <?php echo esc_html( get_the_modified_date( 'j F Y' ) ); ?></p>
	</div>
</article>
	<?php
endwhile;
get_footer();
