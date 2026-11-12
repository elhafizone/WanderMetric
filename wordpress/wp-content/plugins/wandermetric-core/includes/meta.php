<?php
/**
 * Offer fields. Every figure shown on the site comes from these, and every one
 * of them was read from the partner's own listing. There is no field for an
 * invented price, rating or availability, and there must never be one.
 */

defined( 'ABSPATH' ) || exit;

/**
 * @return array<string, array{type: string, label: string}>
 */
function wm_offer_fields(): array {
	return array(
		'wm_programme'    => array( 'type' => 'string', 'label' => 'Partner programme' ),
		'wm_kind'         => array( 'type' => 'string', 'label' => 'Kind of product' ),
		'wm_source_url'   => array( 'type' => 'string', 'label' => 'Partner listing URL (source)' ),
		'wm_read_on'      => array( 'type' => 'string', 'label' => 'Date the listing was read (YYYY-MM-DD)' ),
		'wm_affiliate_url' => array( 'type' => 'string', 'label' => 'Affiliate URL' ),
		'wm_price_note'   => array( 'type' => 'string', 'label' => 'Price as listed, with the date' ),
		'wm_tip'          => array( 'type' => 'string', 'label' => 'Before you go (from the listing)' ),
		'wm_facts'        => array( 'type' => 'string', 'label' => 'Facts (JSON object)' ),
		'wm_images'       => array( 'type' => 'string', 'label' => 'Images (JSON array of {url, alt})' ),
		'wm_image_credit' => array( 'type' => 'string', 'label' => 'Image credit (partner or photographer)' ),
		'wm_legacy_visuals' => array( 'type' => 'boolean', 'label' => 'Legacy offer: images still to be added' ),
	);
}

add_action(
	'init',
	static function () {
		foreach ( wm_offer_fields() as $key => $field ) {
			register_post_meta(
				'wm_offer',
				$key,
				array(
					'type'              => $field['type'],
					'single'            => true,
					'show_in_rest'      => true,
					'description'       => $field['label'],
					'sanitize_callback' => 'boolean' === $field['type'] ? 'rest_sanitize_boolean' : 'wm_sanitize_meta_string',
					'auth_callback'     => static fn( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', $post_id ),
				)
			);
		}
	}
);

/**
 * update_post_meta() has already unslashed the value; unslashing again here
 * stripped the backslashes inside JSON (\" in facts and alt text) and stored
 * invalid JSON. Trim only.
 */
function wm_sanitize_meta_string( $value ): string {
	return is_string( $value ) ? trim( $value ) : '';
}

/** @return array<string, mixed> */
function wm_offer_facts( int $post_id ): array {
	$facts = json_decode( (string) get_post_meta( $post_id, 'wm_facts', true ), true );
	return is_array( $facts ) ? $facts : array();
}

/**
 * Images: `url` is ours (media library), `source` the partner original, `id` the attachment.
 * An image the partner listing gave no description gets one from the offer title
 * ("<title>", then "<title>, photo 2"): it names what the photo is of, nothing more.
 *
 * @return array<int, array{url: string, alt: string, source: string, id: int}>
 */
function wm_offer_images( int $post_id ): array {
	$images = json_decode( (string) get_post_meta( $post_id, 'wm_images', true ), true );
	if ( ! is_array( $images ) ) {
		return array();
	}
	$images = array_values( array_filter( $images, static fn( $i ) => is_array( $i ) && ! empty( $i['url'] ) ) );
	$title  = trim( html_entity_decode( wp_strip_all_tags( get_the_title( $post_id ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
	$out    = array();
	foreach ( $images as $n => $i ) {
		$alt   = trim( (string) ( $i['alt'] ?? '' ) );
		$out[] = array(
			'url'    => (string) $i['url'],
			'alt'    => '' !== $alt ? $alt : ( 0 === $n ? $title : sprintf( '%s, photo %d', $title, $n + 1 ) ),
			'source' => (string) ( $i['source'] ?? $i['url'] ),
			'id'     => (int) ( $i['id'] ?? 0 ),
		);
	}
	return $out;
}

/** Display name of a partner programme slug. */
function wm_programme_name( string $slug ): string {
	$names = array(
		'airalo'          => 'Airalo',
		'airhelp'         => 'AirHelp',
		'autoeurope'      => 'Auto Europe',
		'bikesbooking'    => 'BikesBooking',
		'compensair'      => 'Compensair',
		'drimsim'         => 'Drimsim',
		'economybookings' => 'EconomyBookings',
		'gettransfer'     => 'GetTransfer.com',
		'gigsky'          => 'GigSky',
		'go-city'         => 'Go City',
		'intui-travel'    => 'intui.travel',
		'kiwitaxi'        => 'Kiwitaxi',
		'qeeq'            => 'QEEQ',
		'saily'           => 'Saily',
		'ekta'            => 'EKTA',
		'getrentacar'     => 'GetRentACar',
		'kkday'           => 'KKday',
		'klook'           => 'Klook',
		'localrent'       => 'Localrent',
		'radical-storage' => 'Radical Storage',
		'tiqets'          => 'Tiqets',
		'wegotrip'        => 'WeGoTrip',
		'welcome-pickups' => 'Welcome Pickups',
		'yesim'           => 'Yesim',
	);
	return $names[ $slug ] ?? ucwords( str_replace( '-', ' ', $slug ) );
}

/** "28 October 2026" from the stored YYYY-MM-DD, or '' when absent. */
function wm_offer_read_on( int $post_id ): string {
	$raw = (string) get_post_meta( $post_id, 'wm_read_on', true );
	$ts  = $raw ? strtotime( $raw . ' 00:00:00 UTC' ) : false;
	return $ts ? gmdate( 'j F Y', $ts ) : '';
}

/** Human label for a fact key: "opening_hours" → "Opening hours". */
function wm_fact_label( string $key ): string {
	return ucfirst( str_replace( '_', ' ', $key ) );
}
