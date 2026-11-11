<?php
/**
 * WanderMetric Atlas theme. Presentation only: it reads offers through the
 * wm_* functions of the WanderMetric Core plugin and never queries partners,
 * stores data or builds affiliate URLs itself.
 */

defined( 'ABSPATH' ) || exit;

define( 'WM_THEME_VERSION', '0.1.0' );

require_once get_template_directory() . '/inc/imagery.php';
require_once get_template_directory() . '/inc/template-tags.php';
require_once get_template_directory() . '/inc/logo.php';

add_action(
	'after_setup_theme',
	static function () {
		add_theme_support( 'title-tag' );
		add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
		add_theme_support( 'responsive-embeds' );
		add_theme_support( 'editor-styles' );
		remove_theme_support( 'core-block-patterns' );
		register_nav_menus(
			array(
				'primary' => __( 'Main navigation', 'wandermetric' ),
				'footer'  => __( 'Footer: company and legal', 'wandermetric' ),
			)
		);
	}
);

add_action(
	'wp_enqueue_scripts',
	static function () {
		$uri = get_template_directory_uri();
		// No theme JavaScript: every page works as plain HTML and CSS.
		wp_enqueue_style( 'wandermetric', $uri . '/assets/css/main.css', array(), WM_THEME_VERSION );
		// Block library CSS is only needed where post content renders.
		if ( ! is_singular() ) {
			wp_dequeue_style( 'wp-block-library' );
			wp_dequeue_style( 'global-styles' );
		}
	}
);

/** Preload the two font files; they are self-hosted so no request leaves the site. */
add_action(
	'wp_head',
	static function () {
		$uri = get_template_directory_uri() . '/assets/fonts/';
		foreach ( array( 'gloock-latin.woff2', 'hanken-grotesk-latin.woff2', 'bricolage-grotesque-700-latin.woff2' ) as $file ) {
			printf( '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n", esc_url( $uri . $file ) );
		}
	},
	2
);

/** Trim head output that this site has no use for. */
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wp_shortlink_wp_head' );

/** Site search covers offers only. */
add_action(
	'pre_get_posts',
	static function ( WP_Query $q ) {
		if ( ! is_admin() && $q->is_main_query() && $q->is_search() ) {
			$q->set( 'post_type', 'wm_offer' );
			$q->set( 'posts_per_page', 24 );
		}
	}
);
