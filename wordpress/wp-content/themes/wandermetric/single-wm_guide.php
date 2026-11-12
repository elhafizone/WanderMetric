<?php
/**
 * A guide, laid out for reading:
 *   1. The question as the title, a standfirst, and when the facts were checked.
 *   2. The short answer, beside the place photo and above the fold: most readers
 *      need only that.
 *   3. The article, with its contents beside it on desktop and the offers it
 *      covers within reach; on a phone the contents sit above the article.
 *   4. Every source, with the day it was read. Then the offers as cards.
 * The guide links to our offer pages; the way out to a partner is always /go/.
 */

defined( 'ABSPATH' ) || exit;
get_header();

while ( have_posts() ) :
	the_post();
	$guide    = get_post();
	$sections = wm_sections();
	$section  = (string) get_post_meta( $guide->ID, 'wm_section', true );
	$place    = wm_guide_place( $guide->ID );
	$country  = $place['country'];
	$answer   = wm_guide_answer( $guide->ID );
	$checked  = wm_human_date( wm_guide_checked_on( $guide->ID ) );
	$sources  = wm_guide_sources( $guide->ID );
	$offers   = wm_guide_offers( $guide->ID );
	$content  = wm_guide_content();
	$minutes  = wm_reading_minutes( $content['html'] );
	$photo    = wm_place_photo( $place['city'] ? $place['city']->slug : ( $country ? $country->slug : 'home' ) );
	$where    = $place['city'] && $country ? $place['city']->name . ', ' . $country->name : ( $country ? $country->name : '' );

	$trail = array( array( 'Home', home_url( '/' ) ), array( 'Guides', wm_guides_url() ) );
	if ( $country ) {
		$trail[] = array( $country->name, wm_country_url( $country->slug ) );
	}
	$trail[] = array( get_the_title(), null );

	$toc = static function ( string $class ) use ( $content ) {
		if ( count( $content['toc'] ) < 3 ) {
			return;
		}
		echo '<nav class="toc ' . esc_attr( $class ) . '" aria-label="On this page"><p class="toc-label">On this page</p><ol>';
		foreach ( $content['toc'] as $h ) {
			echo '<li><a href="#' . esc_attr( $h['id'] ) . '">' . esc_html( $h['text'] ) . '</a></li>';
		}
		echo '<li><a href="#sources">Sources</a></li></ol></nav>';
	};
	?>
<article class="guide">
	<div class="guide-top wrap">
		<?php wm_breadcrumbs( $trail ); ?>
		<div class="guide-top-grid<?php echo $photo ? '' : ' guide-top-grid--nophoto'; ?>">
			<header class="guide-head">
				<p class="trip-kicker">
					<?php if ( $where ) : ?><span class="chip chip--place"><?php echo wm_icon( 'pin' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><?php echo esc_html( $where ); ?></span><?php endif; ?>
					<?php if ( isset( $sections[ $section ] ) ) : ?><a class="chip" href="<?php echo esc_url( wm_section_url( $section ) ); ?>"><?php echo esc_html( $sections[ $section ]['short'] ); ?></a><?php endif; ?>
					<span class="chip chip--guide"><?php esc_html_e( 'Guide', 'wandermetric' ); ?></span>
				</p>
				<h1><?php the_title(); ?></h1>
				<?php if ( has_excerpt() ) : ?><p class="guide-standfirst"><?php echo esc_html( get_the_excerpt() ); ?></p><?php endif; ?>
				<p class="guide-meta">
					<?php if ( $checked ) : ?><span><?php echo wm_icon( 'calendar' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>Facts checked <?php echo esc_html( $checked ); ?></span><?php endif; ?>
					<span><?php echo wm_icon( 'check' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><a href="#sources"><?php echo esc_html( sprintf( _n( '%d source', '%d sources', count( $sources ), 'wandermetric' ), count( $sources ) ) ); ?></a></span>
					<span><?php echo wm_icon( 'clock' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><?php echo esc_html( sprintf( '%d min read', $minutes ) ); ?></span>
				</p>
				<?php if ( $answer ) : ?>
					<section class="answer" aria-labelledby="answer-h">
						<h2 id="answer-h" class="answer-label"><?php esc_html_e( 'The short answer', 'wandermetric' ); ?></h2>
						<p><?php echo esc_html( $answer ); ?></p>
					</section>
				<?php endif; ?>
			</header>
			<?php if ( $photo ) : ?>
				<div class="guide-visual"><?php wm_photo( $photo, '(min-width: 64rem) 40vw, 100vw', true, 'guide-photo' ); ?></div>
			<?php endif; ?>
		</div>
	</div>

	<div class="guide-body wrap">
		<div class="guide-main">
			<?php $toc( 'toc--inline' ); ?>

			<div class="prose guide-prose">
				<?php echo $content['html']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the_content output, sanitised on import. ?>
			</div>

			<section class="sources" id="sources" aria-labelledby="sources-h">
				<h2 id="sources-h"><?php esc_html_e( 'Sources', 'wandermetric' ); ?></h2>
				<p class="facts-lede"><?php esc_html_e( 'Every figure on this page comes from these pages, read on the dates shown. Prices and rules change: the operator’s own page has the final word.', 'wandermetric' ); ?></p>
				<ol class="sources-list">
					<?php foreach ( $sources as $s ) : ?>
						<li><a href="<?php echo esc_url( $s['url'] ); ?>" rel="nofollow noopener" target="_blank"><?php echo esc_html( $s['name'] ); ?></a><span><?php echo esc_html( 'Read ' . wm_human_date( $s['read_on'] ) ); ?></span></li>
					<?php endforeach; ?>
				</ol>
			</section>
		</div>

		<aside class="guide-aside" aria-label="<?php esc_attr_e( 'On this page and bookings', 'wandermetric' ); ?>">
			<?php if ( $offers ) : ?>
				<div class="guide-book">
					<p class="toc-label"><?php esc_html_e( 'Book what this guide covers', 'wandermetric' ); ?></p>
					<ul>
						<?php foreach ( $offers as $o ) : ?>
							<?php $partner = wm_programme_name( (string) get_post_meta( $o->ID, 'wm_programme', true ) ); ?>
							<li>
								<a class="guide-book-title" href="<?php echo esc_url( get_permalink( $o ) ); ?>"><?php echo esc_html( get_the_title( $o ) ); ?></a>
								<a class="guide-book-go" href="<?php echo esc_url( wm_go_url( $o, $guide ) ); ?>" rel="sponsored nofollow noopener" target="_blank"><?php echo esc_html( 'Check on ' . $partner ); ?> <?php echo wm_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
							</li>
						<?php endforeach; ?>
					</ul>
					<p class="guide-book-note"><?php esc_html_e( 'Partner links are affiliate links: we may earn a commission, and you pay the partner, not us.', 'wandermetric' ); ?></p>
				</div>
			<?php endif; ?>
			<?php $toc( 'toc--aside' ); // Last, so it can stay in view as the bookings scroll away. ?>
		</aside>
	</div>

	<?php if ( $offers ) : ?>
		<section class="rail wrap" aria-labelledby="covered-h">
			<div class="rail-head"><h2 id="covered-h"><?php esc_html_e( 'The offers in this guide', 'wandermetric' ); ?></h2><p><?php esc_html_e( 'Each one read from the partner’s listing, with the date.', 'wandermetric' ); ?></p></div>
			<div class="rail-grid">
				<?php
				foreach ( array_slice( $offers, 0, 4 ) as $o ) {
					wm_offer_card( $o );
				}
				?>
			</div>
		</section>
	<?php endif; ?>

	<?php $more = array_slice( wm_get_guides( array( 'exclude' => $guide->ID ) ), 0, 3 ); ?>
	<?php if ( $more ) : ?>
		<section class="guide-more wrap" aria-labelledby="more-h">
			<h2 id="more-h"><?php esc_html_e( 'More guides', 'wandermetric' ); ?></h2>
			<ul class="guide-list">
				<?php
				foreach ( $more as $g ) {
					wm_guide_row( $g, 'h3' );
				}
				?>
			</ul>
		</section>
	<?php endif; ?>
</article>
	<?php
endwhile;
get_footer();
