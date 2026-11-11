<?php
/**
 * The publish gate. An offer reaches the public only with: 800+ visible
 * characters of original text, facts, a source URL, a read-on date, a working
 * affiliate URL, a section, a place, and product images with a credit
 * (unless it is a flagged legacy offer).
 *
 * It runs on wp_after_insert_post, which fires after the editor and REST have
 * saved meta and terms, so it sees the final state. A failing post is put
 * back to draft and the reasons are shown to the editor.
 */

defined( 'ABSPATH' ) || exit;

/**
 * @return string[] reasons the offer cannot be published; empty means it passes.
 */
function wm_publish_gate_errors( int $post_id ): array {
	$post   = get_post( $post_id );
	$errors = array();
	if ( ! $post ) {
		return array( 'Offer not found.' );
	}

	$body_chars = mb_strlen( trim( wp_strip_all_tags( $post->post_content ) ) );
	if ( $body_chars < WM_MIN_BODY_CHARS ) {
		$errors[] = sprintf( 'The text is %d characters; it needs at least %d.', $body_chars, WM_MIN_BODY_CHARS );
	}
	if ( ! wm_offer_facts( $post_id ) ) {
		$errors[] = 'Add the facts read from the partner listing.';
	}
	foreach ( array( 'wm_source_url' => 'source URL', 'wm_affiliate_url' => 'affiliate URL' ) as $key => $label ) {
		$url = (string) get_post_meta( $post_id, $key, true );
		if ( ! preg_match( '#^https://#', $url ) || ! wp_http_validate_url( $url ) ) {
			$errors[] = sprintf( 'The %s must be a valid https:// address.', $label );
		}
	}
	if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) get_post_meta( $post_id, 'wm_read_on', true ) ) ) {
		$errors[] = 'Add the date the listing was read (YYYY-MM-DD).';
	}
	$sections = get_the_terms( $post_id, 'wm_section' );
	if ( ! $sections || is_wp_error( $sections ) || count( $sections ) !== 1 ) {
		$errors[] = 'Choose exactly one section.';
	}
	$place = wm_offer_place( $post_id );
	if ( ! $place['country'] ) {
		$errors[] = 'Choose a city or a country.';
	}
	if ( ! get_post_meta( $post_id, 'wm_legacy_visuals', true ) ) {
		if ( ! wm_offer_images( $post_id ) ) {
			$errors[] = 'Add at least one product image from the partner listing.';
		}
		if ( '' === trim( (string) get_post_meta( $post_id, 'wm_image_credit', true ) ) ) {
			$errors[] = 'Name the image source in the image credit.';
		} elseif ( $collision = wm_primary_image_collision( $post_id ) ) {
			$errors[] = sprintf( 'The main image is already used by "%s". Each offer needs its own.', $collision );
		}
	}
	return $errors;
}

/** Title of another offer that already uses this offer's primary image, if any. */
function wm_primary_image_collision( int $post_id ): ?string {
	$images = wm_offer_images( $post_id );
	if ( ! $images ) {
		return null;
	}
	// Compare the partner original, so two local copies of one photo still collide.
	$primary = untrailingslashit( $images[0]['source'] );
	global $wpdb;
	// Compared in PHP: the JSON may store slashes escaped or not, and the offer count is small.
	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT p.ID, m.meta_value FROM {$wpdb->posts} p JOIN {$wpdb->postmeta} m ON m.post_id = p.ID
			 WHERE p.post_type = 'wm_offer' AND p.ID <> %d AND p.post_status IN ('publish','draft','pending','future')
			   AND m.meta_key = 'wm_images'",
			$post_id
		)
	);
	foreach ( $rows as $row ) {
		$other = json_decode( (string) $row->meta_value, true );
		$other_primary = is_array( $other ) && ! empty( $other[0] ) ? (string) ( $other[0]['source'] ?? $other[0]['url'] ?? '' ) : '';
		if ( '' !== $other_primary && untrailingslashit( $other_primary ) === $primary ) {
			return get_the_title( (int) $row->ID );
		}
	}
	return null;
}

add_action(
	'wp_after_insert_post',
	static function ( int $post_id, WP_Post $post ) {
		if ( 'wm_offer' !== $post->post_type || 'publish' !== $post->post_status || wp_is_post_revision( $post_id ) ) {
			return;
		}
		$errors = wm_publish_gate_errors( $post_id );
		if ( ! $errors ) {
			delete_post_meta( $post_id, '_wm_gate_errors' );
			return;
		}
		update_post_meta( $post_id, '_wm_gate_errors', $errors );
		// Avoid recursion: this update re-enters the hook with status draft and returns early.
		wp_update_post(
			array(
				'ID'          => $post_id,
				'post_status' => 'draft',
			)
		);
	},
	20,
	2
);

/** Classic-screen notice with the reasons. */
add_action(
	'admin_notices',
	static function () {
		$screen = get_current_screen();
		if ( ! $screen || 'wm_offer' !== $screen->post_type || empty( $_GET['post'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		$errors = get_post_meta( (int) $_GET['post'], '_wm_gate_errors', true ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! $errors ) {
			return;
		}
		echo '<div class="notice notice-error"><p><strong>' . esc_html__( 'Not published. Fix these first:', 'wandermetric' ) . '</strong></p><ul>';
		foreach ( (array) $errors as $e ) {
			echo '<li>' . esc_html( $e ) . '</li>';
		}
		echo '</ul></div>';
	}
);

/** Expose the reasons to the block editor. */
add_action(
	'rest_api_init',
	static function () {
		register_rest_field(
			'wm_offer',
			'wm_gate_errors',
			array(
				'get_callback' => static fn( $obj ) => array_values( (array) get_post_meta( $obj['id'], '_wm_gate_errors', true ) ),
				'schema'       => array(
					'type'  => 'array',
					'items' => array( 'type' => 'string' ),
				),
			)
		);
	}
);
