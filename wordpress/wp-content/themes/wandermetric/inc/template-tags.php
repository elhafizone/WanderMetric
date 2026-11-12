<?php
/**
 * Small render helpers shared by templates.
 */

defined( 'ABSPATH' ) || exit;

/**
 * A place photograph as <img>, with its credit on the image's top edge.
 * Inside a link (tiles) the credit is plain text: links cannot nest.
 */
function wm_photo( array $photo, string $sizes = '100vw', bool $eager = false, string $class = '', bool $in_link = false ): void {
	$credit = $in_link
		? esc_html( $photo['credit'] )
		: sprintf( '<a href="%s" rel="noopener">%s</a>', esc_url( $photo['credit_url'] ), esc_html( $photo['credit'] ) );
	printf(
		'<figure class="photo %1$s"><img src="%2$s" width="%3$d" height="%4$d" alt="%5$s" sizes="%6$s" style="object-position:%7$s" %8$s decoding="async"><figcaption class="photo-credit">Photo: %9$s / Unsplash</figcaption></figure>',
		esc_attr( $class ),
		esc_url( $photo['src'] ),
		(int) $photo['w'],
		(int) $photo['h'],
		esc_attr( $photo['alt'] ),
		esc_attr( $sizes ),
		esc_attr( $photo['focus'] ),
		$eager ? 'fetchpriority="high"' : 'loading="lazy"',
		$credit // Escaped above.
	);
}

/**
 * An offer's first partner image, from the media library (srcset included).
 * $decorative: the image sits in a link whose text already names the offer
 * (cards), so it gets alt="" and screen readers do not hear the title twice.
 */
function wm_offer_image( WP_Post $offer, string $size = 'large', string $sizes = '(min-width: 64rem) 33vw, 100vw', bool $eager = false, bool $decorative = false ): string {
	return wm_offer_image_at( $offer, 0, $size, $sizes, $eager, $decorative );
}

/** The offer's partner image at position $i, or ''. */
function wm_offer_image_at( WP_Post $offer, int $i, string $size = 'large', string $sizes = '100vw', bool $eager = false, bool $decorative = false ): string {
	$images = wm_offer_images( $offer->ID );
	if ( ! isset( $images[ $i ] ) ) {
		return '';
	}
	$first = $images[ $i ];
	if ( $decorative ) {
		$first['alt'] = '';
	}
	$attrs = array(
		'alt'      => $first['alt'],
		'sizes'    => $sizes,
		'decoding' => 'async',
	);
	$attrs += $eager ? array( 'fetchpriority' => 'high', 'loading' => false ) : array( 'loading' => 'lazy' );
	if ( $first['id'] ) {
		return wp_get_attachment_image( $first['id'], $size, false, $attrs );
	}
	return sprintf( '<img src="%s" alt="%s" loading="lazy" decoding="async">', esc_url( $first['url'] ), esc_attr( $first['alt'] ) );
}

/** "Paris, France" or "Japan" for an offer. */
function wm_offer_place_label( WP_Post $offer ): string {
	$place = wm_offer_place( $offer->ID );
	if ( $place['city'] && $place['country'] ) {
		return $place['city']->name . ', ' . $place['country']->name;
	}
	return $place['country'] ? $place['country']->name : '';
}

/** Render one offer card. */
function wm_offer_card( WP_Post $offer, string $variant = '' ): void {
	get_template_part( 'template-parts/offer-card', null, array( 'offer' => $offer, 'variant' => $variant ) );
}

/** Breadcrumb trail as a list of [label, url|null]. Also emits BreadcrumbList JSON-LD. */
function wm_breadcrumbs( array $trail ): void {
	if ( ! $trail ) {
		return;
	}
	echo '<nav class="crumbs" aria-label="Breadcrumb"><ol>';
	$ld = array();
	foreach ( $trail as $i => [ $label, $url ] ) {
		echo '<li>' . ( $url ? '<a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a>' : '<span aria-current="page">' . esc_html( $label ) . '</span>' ) . '</li>';
		$ld[] = array_filter(
			array(
				'@type'    => 'ListItem',
				'position' => $i + 1,
				'name'     => $label,
				'item'     => $url,
			)
		);
	}
	echo '</ol></nav>';
	printf(
		'<script type="application/ld+json">%s</script>',
		wp_json_encode(
			array(
				'@context'        => 'https://schema.org',
				'@type'           => 'BreadcrumbList',
				'itemListElement' => $ld,
			),
			JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
		)
	);
}

/** Render a fact value: arrays become lists, scalars plain text. */
function wm_fact_value( $value ): string {
	if ( is_array( $value ) ) {
		$items = array_map( static fn( $v ) => '<li>' . esc_html( is_scalar( $v ) ? (string) $v : wp_json_encode( $v ) ) . '</li>', $value );
		return '<ul>' . implode( '', $items ) . '</ul>';
	}
	if ( is_bool( $value ) ) {
		return $value ? 'Yes' : 'No';
	}
	return esc_html( (string) $value );
}

/**
 * A guide's content with an id on every <h2>, and the list of those headings
 * for the "On this page" contents.
 *
 * @return array{html: string, toc: array<int, array{id: string, text: string}>}
 */
function wm_guide_content(): array {
	$html = (string) apply_filters( 'the_content', get_the_content() );
	$toc  = array();
	$html = (string) preg_replace_callback(
		'#<h2(?![^>]*\bid=)([^>]*)>(.*?)</h2>#s',
		static function ( array $m ) use ( &$toc ): string {
			$text = trim( wp_strip_all_tags( $m[2] ) );
			$id   = sanitize_title( $text );
			$base = $id;
			for ( $n = 2; in_array( $id, array_column( $toc, 'id' ), true ); $n++ ) {
				$id = $base . '-' . $n;
			}
			$toc[] = array( 'id' => $id, 'text' => $text );
			return '<h2 id="' . esc_attr( $id ) . '"' . $m[1] . '>' . $m[2] . '</h2>';
		},
		$html
	);
	return array( 'html' => $html, 'toc' => $toc );
}

/** Minutes to read a block of HTML, at 220 words a minute. */
function wm_reading_minutes( string $html ): int {
	return max( 1, (int) round( str_word_count( wp_strip_all_tags( $html ) ) / 220 ) );
}

/** "12 November 2026" from YYYY-MM-DD. */
function wm_human_date( string $ymd ): string {
	$ts = $ymd ? strtotime( $ymd . ' 00:00:00 UTC' ) : false;
	return $ts ? gmdate( 'j F Y', $ts ) : '';
}

/** One guide in a list: place photo, kicker, title, summary, checked date. */
function wm_guide_row( WP_Post $guide, string $heading = 'h2' ): void {
	$place = wm_guide_place( $guide->ID );
	$where = $place['city'] ? $place['city']->name . ', ' . $place['country']->name : ( $place['country'] ? $place['country']->name : '' );
	$photo = wm_place_photo( $place['city'] ? $place['city']->slug : ( $place['country'] ? $place['country']->slug : 'home' ) );
	$tag   = in_array( $heading, array( 'h2', 'h3' ), true ) ? $heading : 'h2';
	?>
	<li class="guide-row">
		<a href="<?php echo esc_url( get_permalink( $guide ) ); ?>">
			<?php if ( $photo ) { wm_photo( $photo, '(min-width: 48rem) 14rem, 100vw', false, 'guide-row-photo', true ); } ?>
			<span class="guide-row-text">
				<?php if ( $where ) : ?><span class="guide-row-kicker"><?php echo esc_html( $where ); ?></span><?php endif; ?>
				<<?php echo esc_html( $tag ); ?> class="guide-row-title"><?php echo esc_html( get_the_title( $guide ) ); ?></<?php echo esc_html( $tag ); ?>>
				<?php if ( has_excerpt( $guide ) ) : ?><span class="guide-row-summary"><?php echo esc_html( get_the_excerpt( $guide ) ); ?></span><?php endif; ?>
				<span class="guide-row-meta"><?php echo esc_html( 'Facts checked ' . wm_human_date( wm_guide_checked_on( $guide->ID ) ) ); ?></span>
			</span>
		</a>
	</li>
	<?php
}
