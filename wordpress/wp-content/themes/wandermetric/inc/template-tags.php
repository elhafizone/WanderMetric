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

/** An offer's first partner image, from the media library (srcset included). */
function wm_offer_image( WP_Post $offer, string $size = 'large', string $sizes = '(min-width: 64rem) 33vw, 100vw', bool $eager = false ): string {
	$images = wm_offer_images( $offer->ID );
	if ( ! $images ) {
		return '';
	}
	$first = $images[0];
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
