<?php
/**
 * An offer, laid out as a travel document:
 *   1. Gallery beside the intro and a "pass": who you book with, the price as
 *      listed, a perforation, then the booking action.
 *   2. At a glance: the four or five facts that decide a booking, with icons.
 *   3. Check before you book, the listing's options, included / not included,
 *      the original text, and everything else the listing said.
 * A slim pass follows on desktop; on a phone a bottom bar keeps the action in reach.
 * The way out to the partner is always /go/.
 */

defined( 'ABSPATH' ) || exit;
get_header();

while ( have_posts() ) :
	the_post();
	$offer    = get_post();
	$sections = wm_sections();
	$section  = wm_offer_section( $offer->ID );
	$place    = wm_offer_place( $offer->ID );
	$country  = $place['country'];
	$facts    = wm_offer_facts( $offer->ID );
	$partner  = wm_programme_name( (string) get_post_meta( $offer->ID, 'wm_programme', true ) );
	$read_on  = wm_offer_read_on( $offer->ID );
	$price    = (string) get_post_meta( $offer->ID, 'wm_price_note', true );
	$tip      = (string) get_post_meta( $offer->ID, 'wm_tip', true );
	$credit   = (string) get_post_meta( $offer->ID, 'wm_image_credit', true );
	$source   = (string) get_post_meta( $offer->ID, 'wm_source_url', true );
	$go       = wm_go_url( $offer );
	$images   = wm_offer_images( $offer->ID );
	$rating   = wm_offer_rating( $facts );
	$caution  = wm_offer_caution( $facts );
	$options  = wm_offer_options( $facts );
	$incl     = wm_offer_inclusions( $facts );
	$glance   = wm_offer_glance( $facts );
	$glance_k = array_column( $glance, 'key' );
	$rows     = array_diff_key( wm_offer_fact_rows( $facts ), array_flip( $glance_k ) );

	// The price note opens with "Read on <date>:", which the pass already says.
	$price_short = trim( (string) preg_replace( '/^\s*(?:read|verified|checked)\s+on\s+[^:]+:\s*/i', '', $price ) );

	$trail = array( array( 'Home', home_url( '/' ) ) );
	if ( $section ) {
		$trail[] = array( $sections[ $section ]['name'], wm_section_url( $section ) );
		if ( $country ) {
			$trail[] = array( $country->name, wm_section_url( $section, $country->slug ) );
		}
	}
	$trail[] = array( get_the_title(), null );


	// "Check before you book": in the right column on desktop, in the flow on smaller screens.
	$caution_note = static function ( string $class ) use ( $caution, $tip ) {
		if ( ! $caution && ! $tip ) {
			return;
		}
		echo '<aside class="note note--warn ' . esc_attr( $class ) . '">' . wm_icon( 'alert' ) . '<div><h2>Check before you book</h2>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		if ( $caution ) {
			echo '<p>' . esc_html( $caution ) . '</p>';
		}
		if ( $tip ) {
			echo '<p>' . esc_html( $tip ) . '</p>';
		}
		echo '</div></aside>';
	};

	$cta = static function ( string $class = '', bool $short = false ) use ( $go, $partner ) {
		printf(
			'<a class="btn-cta %1$s" href="%2$s" rel="sponsored nofollow noopener" target="_blank">%3$s %4$s</a>',
			esc_attr( $class ),
			esc_url( $go ),
			esc_html( $short ? 'Check availability' : 'Check availability on ' . $partner ),
			wm_icon( 'arrow' ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG.
		);
	};
	?>
<article class="trip">
	<div class="trip-top wrap">
		<?php wm_breadcrumbs( $trail ); ?>

		<div class="trip-hero<?php echo $images ? '' : ' trip-hero--noimage'; ?>">
			<div class="trip-gallery trip-gallery--<?php echo (int) min( count( $images ), 4 ); ?>">
				<?php if ( $images ) : ?>
					<figure class="trip-shot trip-shot--main">
						<?php echo wm_offer_image_at( $offer, 0, 'large', '(min-width: 64rem) 52vw, 100vw', true ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<?php if ( $credit ) : ?><figcaption class="photo-credit">Photo: <?php echo esc_html( $credit ); ?></figcaption><?php endif; ?>
					</figure>
					<?php for ( $i = 1; $i < min( count( $images ), 4 ); $i++ ) : ?>
						<figure class="trip-shot"><?php echo wm_offer_image_at( $offer, $i, 'medium_large', '(min-width: 64rem) 17vw, 33vw' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></figure>
					<?php endfor; ?>
				<?php else : ?>
					<div class="trip-shot trip-shot--type" aria-hidden="true"><span><?php echo esc_html( $place['city'] ? $place['city']->name : ( $country ? $country->name : '' ) ); ?></span></div>
				<?php endif; ?>
			</div>

			<div class="trip-intro">
				<p class="trip-kicker">
					<span class="chip chip--place"><?php echo wm_icon( 'pin' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><?php echo esc_html( wm_offer_place_label( $offer ) ); ?></span>
					<?php if ( $section ) : ?><a class="chip" href="<?php echo esc_url( wm_section_url( $section ) ); ?>"><?php echo esc_html( $sections[ $section ]['short'] ); ?></a><?php endif; ?>
				</p>
				<h1><?php the_title(); ?></h1>
				<?php if ( $rating ) : ?>
					<p class="trip-rating">
						<?php if ( $rating['score'] ) : ?><span class="trip-score"><?php echo wm_icon( 'star' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><?php echo esc_html( rtrim( rtrim( number_format( $rating['score'], 1 ), '0' ), '.' ) ); ?></span><?php endif; ?>
						<span><?php echo esc_html( $rating['text'] ); ?> on <?php echo esc_html( $partner ); ?></span>
					</p>
				<?php endif; ?>
				<?php if ( has_excerpt() ) : ?>
					<p class="trip-summary"><?php echo esc_html( get_the_excerpt() ); ?></p>
				<?php endif; ?>

				<aside class="pass" aria-label="<?php echo esc_attr( 'Book on ' . $partner ); ?>">
					<div class="pass-top">
						<p class="pass-partner"><span>Booked on</span> <strong><?php echo esc_html( $partner ); ?></strong></p>
						<p class="pass-trust"><?php echo wm_icon( 'shield' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>You pay <?php echo esc_html( $partner ); ?> directly, not us.</p>
						<?php if ( $price_short ) : ?>
							<p class="pass-price"><?php echo esc_html( $price_short ); ?></p>
						<?php endif; ?>
					</div>
					<div class="pass-tear" aria-hidden="true"></div>
					<div class="pass-bottom">
						<?php $cta(); ?>
						<p class="pass-meta">
							<?php if ( $read_on ) : ?><span><?php echo wm_icon( 'calendar' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>Read on <?php echo esc_html( $read_on ); ?></span><?php endif; ?>
							<?php if ( $source ) : ?><a href="<?php echo esc_url( $source ); ?>" rel="nofollow noopener" target="_blank">The listing we read</a><?php endif; ?>
						</p>
						<p class="pass-note">Affiliate link. Price and availability are set by <?php echo esc_html( $partner ); ?> and can change after this date.</p>
					</div>
				</aside>
			</div>
		</div>
	</div>

	<?php if ( $glance ) : ?>
		<div class="glance-band">
			<ul class="glance wrap" aria-label="At a glance">
				<?php foreach ( $glance as $g ) : ?>
					<li>
						<?php echo wm_icon( $g['icon'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<span class="glance-label"><?php echo esc_html( $g['label'] ); ?></span>
						<span class="glance-value"><?php echo esc_html( $g['value'] ); ?></span>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
	<?php endif; ?>

	<div class="trip-body wrap">
		<div class="trip-main">
			<?php $caution_note( 'note--inline' ); ?>

			<?php if ( count( $options ) >= 2 ) : ?>
				<section class="options" aria-labelledby="options-h">
					<h2 id="options-h">Options on the listing</h2>
					<ol class="options-list">
						<?php foreach ( $options as $n => $o ) : ?>
							<li class="option">
								<span class="option-n">Option <?php echo (int) $n + 1; ?></span>
								<h3><?php echo esc_html( $o['name'] ); ?></h3>
								<?php if ( $o['detail'] ) : ?><p><?php echo esc_html( $o['detail'] ); ?></p><?php endif; ?>
							</li>
						<?php endforeach; ?>
					</ol>
					<p class="options-note">You pick the option on <?php echo esc_html( $partner ); ?>’s checkout.</p>
				</section>
			<?php endif; ?>

			<?php if ( $incl['included'] || $incl['excluded'] ) : ?>
				<section class="incl" aria-label="What is included">
					<?php if ( $incl['included'] ) : ?>
						<div class="incl-col incl-col--yes">
							<h2>Included</h2>
							<ul><?php foreach ( $incl['included'] as $item ) : ?><li><?php echo wm_icon( 'check' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><span><?php echo esc_html( $item ); ?></span></li><?php endforeach; ?></ul>
						</div>
					<?php endif; ?>
					<?php if ( $incl['excluded'] ) : ?>
						<div class="incl-col incl-col--no">
							<h2>Not included</h2>
							<ul><?php foreach ( $incl['excluded'] as $item ) : ?><li><?php echo wm_icon( 'x' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><span><?php echo esc_html( $item ); ?></span></li><?php endforeach; ?></ul>
						</div>
					<?php endif; ?>
				</section>
			<?php endif; ?>

			<div class="prose">
				<?php the_content(); ?>
			</div>

			<?php if ( $rows ) : ?>
				<section class="facts" aria-labelledby="facts-h">
					<h2 id="facts-h">Everything the listing says</h2>
					<p class="facts-lede">As shown on <?php echo esc_html( $partner ); ?><?php echo $read_on ? ', read ' . esc_html( $read_on ) : ''; ?>.</p>
					<dl>
						<?php foreach ( $rows as $key => $value ) : ?>
							<?php if ( '' === $value || null === $value || array() === $value ) { continue; } ?>
							<div><dt><?php echo esc_html( wm_fact_label( (string) $key ) ); ?></dt><dd><?php echo wm_fact_value( $value ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></dd></div>
						<?php endforeach; ?>
					</dl>
				</section>
			<?php endif; ?>
		</div>

		<aside class="trip-aside" aria-label="Book">
			<div class="pass pass--slim">
				<p class="pass-partner"><span>Booked on</span> <strong><?php echo esc_html( $partner ); ?></strong></p>
				<?php if ( $rating && $rating['score'] ) : ?><p class="trip-rating trip-rating--small"><span class="trip-score"><?php echo wm_icon( 'star' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><?php echo esc_html( rtrim( rtrim( number_format( $rating['score'], 1 ), '0' ), '.' ) ); ?></span><span><?php echo esc_html( $rating['count'] ? $rating['count'] . ' reviews' : 'on ' . $partner ); ?></span></p><?php endif; ?>
				<?php $cta( '', true ); ?>
				<?php if ( $read_on ) : ?><p class="pass-meta"><span><?php echo wm_icon( 'calendar' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>Read on <?php echo esc_html( $read_on ); ?></span></p><?php endif; ?>
			</div>
			<?php $caution_note( 'note--aside' ); ?>
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

	<div class="bookbar" aria-label="<?php echo esc_attr( 'Book on ' . $partner ); ?>">
		<p><span>On</span> <strong><?php echo esc_html( $partner ); ?></strong></p>
		<a class="btn-cta" href="<?php echo esc_url( $go ); ?>" rel="sponsored nofollow noopener" target="_blank">Check availability</a>
	</div>
</article>
	<?php
endwhile;
get_footer();
