<?php
/**
 * Plugin Name: WanderMetric Core
 * Description: Offers, the ten sections, places, the publish gate, clean routes and the /go/ affiliate redirect. All site logic lives here; the theme only renders.
 * Version: 0.1.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Author: WanderMetric
 * License: GPL-2.0-or-later
 * Text Domain: wandermetric
 */

defined( 'ABSPATH' ) || exit;

define( 'WM_CORE_VERSION', '0.1.0' );
define( 'WM_CORE_DIR', plugin_dir_path( __FILE__ ) );
define( 'WM_CORE_FILE', __FILE__ );

/** Below this many published offers a country page is noindex (was MIN_OFFERS_FOR_COUNTRY_PAGE). */
define( 'WM_MIN_OFFERS_FOR_COUNTRY_PAGE', 3 );

/** The publish gate's minimum body length, in visible characters. */
define( 'WM_MIN_BODY_CHARS', 800 );

if ( file_exists( WM_CORE_DIR . 'vendor/autoload.php' ) ) {
	require_once WM_CORE_DIR . 'vendor/autoload.php';
}

require_once WM_CORE_DIR . 'includes/sections.php';
require_once WM_CORE_DIR . 'includes/places.php';
require_once WM_CORE_DIR . 'includes/post-types.php';
require_once WM_CORE_DIR . 'includes/meta.php';
require_once WM_CORE_DIR . 'includes/offer-facts.php';
require_once WM_CORE_DIR . 'includes/consent.php';
require_once WM_CORE_DIR . 'includes/widgets.php';
require_once WM_CORE_DIR . 'includes/partners.php';
require_once WM_CORE_DIR . 'includes/publish-gate.php';
require_once WM_CORE_DIR . 'includes/queries.php';
require_once WM_CORE_DIR . 'includes/routing.php';
require_once WM_CORE_DIR . 'includes/go.php';
require_once WM_CORE_DIR . 'includes/seo.php';
require_once WM_CORE_DIR . 'includes/seo-head.php';
require_once WM_CORE_DIR . 'includes/sitemap.php';
require_once WM_CORE_DIR . 'includes/redirects.php';
require_once WM_CORE_DIR . 'includes/hardening.php';
require_once WM_CORE_DIR . 'includes/pages.php';
require_once WM_CORE_DIR . 'includes/cache.php';
require_once WM_CORE_DIR . 'includes/importer.php';
require_once WM_CORE_DIR . 'includes/bundle-import.php';

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once WM_CORE_DIR . 'includes/cli.php';
}

/**
 * Our routes must be in the stored rewrite rules. They go missing when the
 * rules are rebuilt without this plugin loaded (an imported database, another
 * plugin activated by a host job that skips plugins). Each request checks for
 * the /go/ and offer rules, a cheap array lookup, and rebuilds once if absent.
 * Bump WM_ROUTES_VERSION when routes change, to rebuild on deploy.
 */
define( 'WM_ROUTES_VERSION', '4' );

/**
 * News posts live under /news/. The structure is pinned because a WP-CLI call
 * from Git Bash once stored a Windows path in it (MSYS turned '/news/%postname%'
 * into '/C:/Program%20Files/Git/news/%postname%'), which broke every post,
 * category and author link. Change it here, not under Settings → Permalinks.
 */
define( 'WM_PERMALINK_STRUCTURE', '/news/%postname%' );

add_action(
	'init',
	static function () {
		global $wp_rewrite;
		$repair = WM_PERMALINK_STRUCTURE !== get_option( 'permalink_structure' );
		if ( $repair ) {
			$wp_rewrite->set_permalink_structure( WM_PERMALINK_STRUCTURE );
		}
		$rules   = get_option( 'rewrite_rules' );
		$missing = ! is_array( $rules ) || ! isset( $rules['^go/([a-z0-9-]+)/?$'], $rules['^countries/?$'] );
		if ( $repair || $missing || WM_ROUTES_VERSION !== get_option( 'wm_routes_version' ) ) {
			flush_rewrite_rules( false );
			update_option( 'wm_routes_version', WM_ROUTES_VERSION, true );
		}
	},
	999
);

register_activation_hook( __FILE__, 'wm_activate' );
register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );

/**
 * Activation: register types so the rules exist, seed the fixed terms,
 * create the click table, then flush rewrites once.
 */
function wm_activate(): void {
	wm_register_post_types();
	wm_seed_sections();
	wm_seed_places();
	wm_install_click_table();
	wm_register_routes();
	flush_rewrite_rules();
}
