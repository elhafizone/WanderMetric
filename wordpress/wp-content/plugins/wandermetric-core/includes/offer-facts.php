<?php
/**
 * Reading the facts an offer was written from. Ported from the Next.js
 * src/core/content/offer-facts.ts so both sites read the same JSON the same way.
 *
 * Every value here was read from the partner's listing. Nothing is derived,
 * estimated or rounded into a new claim.
 */

defined( 'ABSPATH' ) || exit;

/** Keys rendered in their own sections, never in the generic fact table. */
function wm_fact_section_keys(): array {
	return array( 'options', 'unclear_on_listing', 'images', 'image_credit', 'rating', 'included', 'included_listed', 'not_included' );
}

/**
 * The listing's options (ticket tiers, plan types).
 *
 * @return array<int, array{name: string, detail: string}>
 */
function wm_offer_options( array $facts ): array {
	$out = array();
	foreach ( (array) ( $facts['options'] ?? array() ) as $o ) {
		if ( ! is_array( $o ) || empty( $o['name'] ) || ! is_string( $o['name'] ) ) {
			continue;
		}
		$detail = implode( ' ', array_filter( array( $o['format'] ?? '', $o['cancellation'] ?? '' ), 'is_string' ) );
		$out[]  = array(
			'name'   => $o['name'],
			'detail' => trim( $detail ),
		);
	}
	return $out;
}

/** What the listing leaves unclear: shown as "Check before you book". */
function wm_offer_caution( array $facts ): ?string {
	$v = $facts['unclear_on_listing'] ?? null;
	return is_string( $v ) && '' !== trim( $v ) ? trim( $v ) : null;
}

/**
 * The aggregate rating as the listing showed it. Either a structured
 * {score, scale, count_label} or the sentence the listing used.
 *
 * @return array{score: ?float, scale: ?float, count: ?string, text: string}|null
 */
function wm_offer_rating( array $facts ): ?array {
	$r = $facts['rating'] ?? null;
	if ( is_array( $r ) && isset( $r['score'] ) && is_numeric( $r['score'] ) ) {
		$scale = isset( $r['scale'] ) && is_numeric( $r['scale'] ) ? (float) $r['scale'] : 5.0;
		$count = isset( $r['count_label'] ) && '' !== (string) $r['count_label'] ? (string) $r['count_label'] : null;
		return array(
			'score' => (float) $r['score'],
			'scale' => $scale,
			'count' => $count,
			'text'  => rtrim( rtrim( number_format( (float) $r['score'], 1 ), '0' ), '.' ) . ' / ' . rtrim( rtrim( number_format( $scale, 1 ), '0' ), '.' ) . ( $count ? ' from ' . $count . ' reviews' : '' ),
		);
	}
	if ( is_string( $r ) && '' !== trim( $r ) ) {
		$score = preg_match( '/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/', $r, $m ) ? (float) $m[1] : null;
		return array(
			'score' => $score,
			'scale' => $score ? (float) $m[2] : null,
			'count' => null,
			'text'  => trim( $r ),
		);
	}
	return null;
}

/** @return array{included: string[], excluded: string[]} */
function wm_offer_inclusions( array $facts ): array {
	$strings  = static fn( $v ) => array_values( array_filter( (array) $v, static fn( $x ) => is_string( $x ) && '' !== trim( $x ) ) );
	$included = $strings( $facts['included_listed'] ?? array() );
	if ( ! $included ) {
		$included = $strings( $facts['included'] ?? array() );
	}
	return array(
		'included' => $included,
		'excluded' => $strings( $facts['not_included'] ?? array() ),
	);
}

/**
 * The remaining facts, in listing order, for the "as listed" table.
 *
 * @return array<string, mixed>
 */
function wm_offer_fact_rows( array $facts ): array {
	return array_diff_key( $facts, array_flip( wm_fact_section_keys() ) );
}

/**
 * Up to five headline facts for the at-a-glance strip, each with an icon
 * name. Order is by usefulness for a booking decision.
 *
 * @return array<int, array{key: string, label: string, value: string, icon: string}>
 */
function wm_offer_glance( array $facts ): array {
	$wanted = array(
		'duration_minutes' => array( 'Duration', 'clock' ),
		'duration'         => array( 'Duration', 'clock' ),
		'opening_hours'    => array( 'Opening hours', 'clock' ),
		'meeting_point'    => array( 'Meeting point', 'pin' ),
		'departs_from'     => array( 'Pick-up', 'pin' ),
		'venue'            => array( 'Where', 'pin' ),
		'location'         => array( 'Where', 'pin' ),
		'cancellation'     => array( 'Cancellation', 'calendar' ),
		'ticket_delivery'  => array( 'Ticket', 'ticket' ),
		'voucher_format'   => array( 'Ticket', 'ticket' ),
		'group_size'       => array( 'Group size', 'users' ),
		'network'          => array( 'Network', 'signal' ),
		'plan_type'        => array( 'Plan', 'signal' ),
		'hotspot'          => array( 'Hotspot', 'signal' ),
		'guide_language'   => array( 'Languages', 'globe' ),
		'languages'        => array( 'Languages', 'globe' ),
	);
	$out   = array();
	$seen  = array();
	foreach ( $wanted as $key => [ $label, $icon ] ) {
		if ( count( $out ) >= 5 || isset( $seen[ $label ] ) || ! isset( $facts[ $key ] ) ) {
			continue;
		}
		$v = $facts[ $key ];
		if ( 'duration_minutes' === $key && is_numeric( $v ) ) {
			$v = wm_format_minutes( (int) $v );
		} elseif ( is_array( $v ) ) {
			$v = implode( ', ', array_filter( $v, 'is_string' ) );
		}
		if ( ! is_scalar( $v ) || '' === trim( (string) $v ) ) {
			continue;
		}
		$seen[ $label ] = true;
		$out[]          = array(
			'key'   => $key,
			'label' => $label,
			'value' => (string) $v,
			'icon'  => $icon,
		);
	}
	return $out;
}

/** 51 → "51 min", 150 → "2 h 30 min". */
function wm_format_minutes( int $m ): string {
	if ( $m < 60 ) {
		return $m . ' min';
	}
	$h = intdiv( $m, 60 );
	$r = $m % 60;
	return $h . ' h' . ( $r ? ' ' . $r . ' min' : '' );
}
