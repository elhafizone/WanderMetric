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
		'istanbul'  => array( 'file' => 'istanbul.jpg', 'w' => 1800, 'h' => 1012, 'alt' => 'The Süleymaniye Mosque above the Golden Horn in Istanbul, with ferries moored along the shore', 'credit' => 'Ibrahim Uzun', 'credit_url' => 'https://unsplash.com/@ibuzn', 'focus' => '35% 45%' ),
		'athens'    => array( 'file' => 'athens.jpg', 'w' => 1800, 'h' => 1200, 'alt' => 'The Acropolis of Athens with the Parthenon at golden hour, seen from Filopappou Hill', 'credit' => 'Constantinos Kollias', 'credit_url' => 'https://unsplash.com/@ckollias', 'focus' => '60% 45%' ),
		'dubai'     => array( 'file' => 'dubai.jpg', 'w' => 1800, 'h' => 1200, 'alt' => 'The Burj Khalifa and Downtown Dubai towers at night above a lit motorway interchange', 'credit' => 'ZQ Lee', 'credit_url' => 'https://unsplash.com/@zqlee', 'focus' => '72% 40%' ),
		'london'    => array( 'file' => 'london.jpg', 'w' => 1800, 'h' => 1200, 'alt' => 'Big Ben and the Houses of Parliament across the River Thames in London at dusk', 'credit' => 'Eduard Pretsi', 'credit_url' => 'https://unsplash.com/@eduard199x', 'focus' => '50% 50%' ),
		'bangkok'   => array( 'file' => 'bangkok.jpg', 'w' => 1800, 'h' => 1350, 'alt' => 'Wat Arun lit at sunset beside the Chao Phraya River in Bangkok, with boats on the water', 'credit' => 'Haley Hong', 'credit_url' => 'https://unsplash.com/@hong_amateurish', 'focus' => '50% 55%' ),
		'phuket'    => array( 'file' => 'phuket.jpg', 'w' => 1800, 'h' => 1200, 'alt' => 'Colourful Sino-Portuguese shophouses on a street in Phuket Old Town', 'credit' => 'Sadiq Ahmad', 'credit_url' => 'https://unsplash.com/@dearsadiq', 'focus' => '60% 50%' ),
		'aswan'     => array( 'file' => 'aswan.jpg', 'w' => 1800, 'h' => 1200, 'alt' => 'A felucca sailing on the Nile at Aswan below the hill of the Tombs of the Nobles', 'credit' => 'Eszter Kisgyura', 'credit_url' => 'https://unsplash.com/photos/7ObNCbySGGc', 'focus' => '40% 68%' ),
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
		'egypt'    => 'aswan',
		'turkey'   => 'istanbul',
		'greece'   => 'athens',
		'united-arab-emirates' => 'dubai',
		'united-kingdom' => 'london',
		'thailand' => 'bangkok',
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
