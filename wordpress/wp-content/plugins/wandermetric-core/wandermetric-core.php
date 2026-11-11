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
require_once WM_CORE_DIR . 'includes/publish-gate.php';
require_once WM_CORE_DIR . 'includes/queries.php';
require_once WM_CORE_DIR . 'includes/routing.php';
require_once WM_CORE_DIR . 'includes/go.php';
require_once WM_CORE_DIR . 'includes/seo.php';
require_once WM_CORE_DIR . 'includes/sitemap.php';

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once WM_CORE_DIR . 'includes/cli.php';
}

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
