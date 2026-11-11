<?php
/**
 * LiteSpeed Cache settings, kept in code so they are reviewed and versioned
 * instead of clicked. Applied at runtime through LiteSpeed's own
 * `litespeed_conf_force` action (src/conf.cls.php, force_option), which runs
 * after its configuration loads and before its features start
 * (after_setup_theme). Nothing here runs unless LiteSpeed Cache is active.
 *
 * Checked against LiteSpeed Cache 7.9.3 (src/base.cls.php option IDs,
 * data/const.default.json defaults) on 2026-11-11.
 */

defined( 'ABSPATH' ) || exit;

/** @return array<string, mixed> LiteSpeed option ID => value */
function wm_litespeed_settings(): array {
	return array(
		// Page cache for visitors. The HTML is identical for everyone: the
		// consent choice is read in the browser, never on the server.
		'cache'          => true,
		// Only the owner logs in; a private cache would only risk stale admin views.
		'cache-priv'     => false,
		// Every click must be logged and redirected fresh.
		'cache-exc'      => array( '^/go/' ),
		// Updates to plugins and the theme show at once.
		'purge-upgrade'  => true,
		// Smaller files; combining stays off (HTTP/2 makes it pointless).
		'optm-css_min'   => true,
		'optm-js_min'    => true,
		'optm-html_min'  => true,
		'optm-css_comb'  => false,
		'optm-js_comb'   => false,
		// Keep ?ver=: the theme versions assets by file time to bust caches.
		'optm-qs_rm'     => false,
		'optm-emoji_rm'  => true,
		// Images already use native loading="lazy".
		'media-lazy'     => false,
		// Both need QUIC.cloud or load the shared server; not wanted.
		'guest'          => false,
		'crawler'        => false,
	);
}

add_action(
	'plugins_loaded',
	static function () {
		if ( ! defined( 'LSCWP_V' ) ) {
			return;
		}
		foreach ( wm_litespeed_settings() as $id => $value ) {
			do_action( 'litespeed_conf_force', $id, $value );
		}
	},
	20
);
