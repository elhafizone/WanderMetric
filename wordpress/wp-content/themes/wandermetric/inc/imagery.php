<?php
/**
 * Place photographs. These are our own licensed files (Unsplash licence,
 * credited on the page), used only for place-level pages and tiles.
 * An offer never borrows one: offers show their own partner images.
 */

defined( 'ABSPATH' ) || exit;

/**
 * @return array<string, array{file: string, w: int, h: int, alt: string, credit: string, credit_url: string, focus: string}>
 */
function wm_place_photos(): array {
	return array(
		'paris'     => array( 'file' => 'paris.jpg', 'w' => 1800, 'h' => 1350, 'alt' => 'The Eiffel Tower lit at night, seen down a Parisian street past a café', 'credit' => 'Lens by Benji', 'credit_url' => 'https://unsplash.com/@lens_by_benji', 'focus' => '50% 50%' ),
		'rome'      => array( 'file' => 'rome.jpg', 'w' => 1800, 'h' => 1200, 'alt' => "The façade of St Peter's Basilica in Vatican City, hung with red drapery", 'credit' => 'Gabriella Clare Marino', 'credit_url' => 'https://unsplash.com/@gabiontheroad', 'focus' => '50% 50%' ),
		'lisbon'    => array( 'file' => 'lisbon.jpg', 'w' => 1800, 'h' => 1197, 'alt' => 'A yellow tram climbing a narrow street between tiled buildings in Lisbon', 'credit' => 'Aayush Gupta', 'credit_url' => 'https://unsplash.com/@aayush_gupta', 'focus' => '50% 50%' ),
		'barcelona' => array( 'file' => 'barcelona.jpg', 'w' => 1800, 'h' => 1200, 'alt' => 'Visitors crossing an open square in front of a Modernista façade in Barcelona', 'credit' => 'Colin + Meg', 'credit_url' => 'https://unsplash.com/@colinandmeg', 'focus' => '50% 50%' ),
		'tokyo'     => array( 'file' => 'tokyo.jpg', 'w' => 1800, 'h' => 1200, 'alt' => 'An illuminated temple gate above a busy Tokyo street after dark', 'credit' => 'mos design', 'credit_url' => 'https://unsplash.com/@mosdesign', 'focus' => '50% 50%' ),
		'home'      => array( 'file' => 'horizon.jpg', 'w' => 2000, 'h' => 1125, 'alt' => 'An empty road curving between sunlit rock formations in late afternoon light', 'credit' => 'Jack Cohen', 'credit_url' => 'https://unsplash.com/@jackcohen', 'focus' => '50% 60%' ),
	);
}

/** Country pages use their main city's photo. */
function wm_place_photo( string $slug ): ?array {
	$by_country = array(
		'france'   => 'paris',
		'italy'    => 'rome',
		'portugal' => 'lisbon',
		'spain'    => 'barcelona',
		'japan'    => 'tokyo',
	);
	$photos = wm_place_photos();
	$key    = isset( $photos[ $slug ] ) ? $slug : ( $by_country[ $slug ] ?? null );
	if ( ! $key || ! isset( $photos[ $key ] ) ) {
		return null;
	}
	$photo        = $photos[ $key ];
	$photo['src'] = get_template_directory_uri() . '/assets/img/' . $photo['file'];
	return $photo;
}
