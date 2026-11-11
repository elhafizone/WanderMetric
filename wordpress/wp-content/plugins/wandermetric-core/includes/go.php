<?php
/**
 * /go/{offer-slug}/ : the only way the site links to a partner.
 *
 * Records the click (offer, time, the page it came from, the referrer's host)
 * and redirects to the stored affiliate URL. No IP, no cookie, no fingerprint.
 * Affiliate URLs never appear in templates; they are read from the offer here.
 */

defined( 'ABSPATH' ) || exit;

function wm_click_table(): string {
	global $wpdb;
	return $wpdb->prefix . 'wm_clicks';
}

function wm_install_click_table(): void {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$table   = wm_click_table();
	$charset = $wpdb->get_charset_collate();
	dbDelta(
		"CREATE TABLE {$table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			offer_id bigint(20) unsigned NOT NULL,
			clicked_at datetime NOT NULL,
			from_path varchar(255) NOT NULL DEFAULT '',
			referrer_host varchar(191) NOT NULL DEFAULT '',
			PRIMARY KEY  (id),
			KEY offer_time (offer_id, clicked_at)
		) {$charset};"
	);
}

add_action(
	'init',
	static function () {
		add_rewrite_rule( '^go/([a-z0-9-]+)/?$', 'index.php?wm_go=$matches[1]', 'top' );
		add_rewrite_tag( '%wm_go%', '([a-z0-9-]+)' );
	},
	20
);

/** Link to an offer's partner page, always through /go/. */
function wm_go_url( WP_Post $offer ): string {
	$from = wp_parse_url( get_permalink( $offer ), PHP_URL_PATH );
	return add_query_arg( 'from', rawurlencode( (string) $from ), home_url( user_trailingslashit( 'go/' . $offer->post_name ) ) );
}

add_action(
	'template_redirect',
	static function () {
		$slug = (string) get_query_var( 'wm_go' );
		if ( '' === $slug ) {
			return;
		}
		$offer = get_page_by_path( $slug, OBJECT, 'wm_offer' );
		$url   = $offer && 'publish' === $offer->post_status ? (string) get_post_meta( $offer->ID, 'wm_affiliate_url', true ) : '';

		header( 'X-Robots-Tag: noindex, nofollow', true );
		nocache_headers();

		if ( ! $offer || ! preg_match( '#^https://#', $url ) ) {
			status_header( 404 );
			global $wp_query;
			$wp_query->set_404();
			return;
		}

		global $wpdb;
		$from     = isset( $_GET['from'] ) ? substr( sanitize_text_field( wp_unslash( $_GET['from'] ) ), 0, 255 ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$referrer = isset( $_SERVER['HTTP_REFERER'] ) ? (string) wp_parse_url( esc_url_raw( wp_unslash( $_SERVER['HTTP_REFERER'] ) ), PHP_URL_HOST ) : '';
		$ok       = $wpdb->insert(
			wm_click_table(),
			array(
				'offer_id'      => $offer->ID,
				'clicked_at'    => current_time( 'mysql', true ),
				'from_path'     => $from,
				'referrer_host' => substr( $referrer, 0, 191 ),
			),
			array( '%d', '%s', '%s', '%s' )
		);
		if ( false === $ok ) {
			// Never lose the visitor over a logging failure, but never fail silently either.
			error_log( 'wandermetric: click not recorded for offer ' . $offer->ID . ': ' . $wpdb->last_error ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		}

		// Partner hosts are not on our allow-list for wp_safe_redirect, by design.
		wp_redirect( $url, 302, 'WanderMetric' ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		exit;
	},
	1
);
