<?php
/**
 * The fixed pages (About, Contact, Privacy, Terms, Affiliate disclosure) are
 * written in content/pages/<slug>.html; those files are the source of truth.
 *
 * `wordpress/bundle-offers.sh` copies them into data/pages/ with a .bundle
 * hash. When a deploy brings a new hash, the next request updates each existing
 * page whose text or links differ from its file. Pages are never created or
 * deleted here, and an unchanged bundle touches nothing, so an edit made in
 * wp-admin lasts only until the files change again: edit the files instead.
 */

defined( 'ABSPATH' ) || exit;

function wm_pages_dir(): string {
	return WM_CORE_DIR . 'data/pages';
}

/** What a reader sees: the text plus every link target, whitespace ignored. */
function wm_page_signature( string $html ): string {
	preg_match_all( '/href="([^"]*)"/', $html, $m );
	$text = html_entity_decode( wp_strip_all_tags( $html ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	return trim( (string) preg_replace( '/\s+/u', ' ', $text ) ) . '|' . implode( ' ', $m[1] );
}

add_action(
	'init',
	static function () {
		$f    = wm_pages_dir() . '/.bundle';
		$hash = is_file( $f ) ? trim( (string) file_get_contents( $f ) ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
		if ( '' === $hash || get_option( 'wm_pages_bundle' ) === $hash ) {
			return;
		}
		// Recorded first: a failure below must not retry on every request.
		update_option( 'wm_pages_bundle', $hash, false );

		$changed = array();
		foreach ( glob( wm_pages_dir() . '/*.html' ) ?: array() as $file ) {
			$slug = basename( $file, '.html' );
			$page = get_page_by_path( $slug );
			$html = trim( (string) file_get_contents( $file ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
			if ( ! $page || '' === $html || wm_page_signature( $html ) === wm_page_signature( $page->post_content ) ) {
				continue;
			}
			// wp_update_post unslashes its input, so slash it first or backslashes are lost.
			$result = wp_update_post( wp_slash( array( 'ID' => $page->ID, 'post_content' => $html ) ), true );
			if ( ! is_wp_error( $result ) ) {
				$changed[] = $slug;
			}
		}
		update_option( 'wm_pages_log', array( 'at' => current_time( 'mysql', true ), 'updated' => $changed ), false );
		if ( $changed ) {
			do_action( 'litespeed_purge_all' );
		}
	},
	41
);
