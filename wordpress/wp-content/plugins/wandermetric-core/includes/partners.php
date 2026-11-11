<?php
/**
 * Partners for the compare pages, and their /go/{partner} links.
 *
 * data/partners.json is ported from the Next.js site (partners.ts and
 * COMPARE_SECTIONS); every sentence restates what the partner says about
 * itself. A partner's button goes to /go/{linkSlug}. The affiliate URL is made
 * at click time through the Travelpayouts partner-links API, exactly as the
 * Next.js redirector did (docs/travelpayouts.md):
 *
 *   POST https://api.travelpayouts.com/links/v1/create
 *   x-access-token: <token>
 *   { trs, marker, shorten: false, links: [{ url: <brand url>, sub_id }] }
 *
 * Success is read from the link itself (code "success" + partner_url), because
 * an unsubscribed brand still answers HTTP 200. The last good link per partner
 * is kept as a fallback. A partner with no way to make a link shows no button.
 *
 * Configure in wp-config.php (never in the repository):
 *   define( 'WM_TP_API_TOKEN', '…' );  // Travelpayouts API token
 * The project (trs) and partner marker are WM_TP_PROJECT / WM_TP_MARKER in widgets.php.
 */

defined( 'ABSPATH' ) || exit;

/** @return array{partners: array<string, array<int, array<string, mixed>>>, compare: array<int, array<string, mixed>>} */
function wm_partner_data(): array {
	static $data = null;
	if ( null === $data ) {
		$raw  = file_get_contents( WM_CORE_DIR . 'data/partners.json' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
		$data = json_decode( (string) $raw, true ) ?: array( 'partners' => array(), 'compare' => array() );
	}
	return $data;
}

function wm_partner( string $slug ): ?array {
	foreach ( wm_partner_data()['partners'] as $list ) {
		foreach ( $list as $p ) {
			if ( $p['linkSlug'] === $slug ) {
				return $p;
			}
		}
	}
	return null;
}

/** Compare section for a section slug, or null when that section has no compare page. */
function wm_compare_section( string $section ): ?array {
	foreach ( wm_partner_data()['compare'] as $c ) {
		if ( $c['slug'] === $section ) {
			return $c;
		}
	}
	return null;
}

function wm_tp_token(): string {
	return defined( 'WM_TP_API_TOKEN' ) ? (string) WM_TP_API_TOKEN : '';
}

/** Can this partner's button lead somewhere attributed? */
function wm_partner_link_ready( array $p ): bool {
	return ! empty( $p['prebuilt_url'] ) || ( ! empty( $p['brand_url'] ) && '' !== wm_tp_token() ) || (bool) get_option( 'wm_partner_link_' . $p['linkSlug'] );
}

/** Partners of a category whose link works, in editorial order. */
function wm_live_partners( string $category ): array {
	return array_values( array_filter( wm_partner_data()['partners'][ $category ] ?? array(), 'wm_partner_link_ready' ) );
}

function wm_partner_go_url( array $p, string $from = '' ): string {
	$url = home_url( user_trailingslashit( 'go/' . $p['linkSlug'] ) );
	return $from ? add_query_arg( 'from', rawurlencode( $from ), $url ) : $url;
}

/**
 * Make the attributed URL for a partner. Returns '' when no link can be made.
 */
function wm_partner_affiliate_url( array $p, string $sub_id ): string {
	if ( ! empty( $p['prebuilt_url'] ) ) {
		return (string) $p['prebuilt_url'];
	}
	$cache_key = 'wm_partner_link_' . $p['linkSlug'];
	$token     = wm_tp_token();
	if ( $token && ! empty( $p['brand_url'] ) ) {
		$response = wp_remote_post(
			'https://api.travelpayouts.com/links/v1/create',
			array(
				'timeout' => 4,
				'headers' => array(
					'x-access-token' => $token,
					'content-type'   => 'application/json',
					'accept'         => 'application/json',
				),
				'body'    => wp_json_encode(
					array(
						'trs'     => (int) WM_TP_PROJECT,
						'marker'  => (int) WM_TP_MARKER,
						'shorten' => false,
						'links'   => array(
							array(
								'url'    => $p['brand_url'],
								'sub_id' => $sub_id,
							),
						),
					)
				),
			)
		);
		if ( ! is_wp_error( $response ) ) {
			$body = json_decode( (string) wp_remote_retrieve_body( $response ), true );
			$link = $body['result']['links'][0] ?? null;
			if ( 200 === (int) wp_remote_retrieve_response_code( $response ) && 'success' === ( $body['code'] ?? '' ) && 'success' === ( $link['code'] ?? '' ) && ! empty( $link['partner_url'] ) ) {
				update_option( $cache_key, (string) $link['partner_url'], false );
				return (string) $link['partner_url'];
			}
			error_log( 'wandermetric: partner link failed for ' . $p['linkSlug'] . ': ' . ( $link['message'] ?? $body['error'] ?? 'HTTP ' . wp_remote_retrieve_response_code( $response ) ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		} else {
			error_log( 'wandermetric: partner link failed for ' . $p['linkSlug'] . ': ' . $response->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		}
	}
	// Last good link for this partner (attributed, without this click's sub_id).
	return (string) get_option( $cache_key, '' );
}
