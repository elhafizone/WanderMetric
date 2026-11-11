<?php
/**
 * Site header.
 */

defined( 'ABSPATH' ) || exit;
$sections = function_exists( 'wm_sections' ) ? wm_sections() : array();
$nav      = array( 'tours-activities', 'transfers', 'sim-cards', 'car-rentals', 'insurance' );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip" href="#main"><?php esc_html_e( 'Skip to content', 'wandermetric' ); ?></a>
<header class="masthead">
	<div class="masthead-inner">
		<a class="wordmark" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php echo wm_logo(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></a>
		<nav class="mainnav" aria-label="<?php esc_attr_e( 'Main', 'wandermetric' ); ?>">
			<ul>
				<li><a href="<?php echo esc_url( home_url( '/countries/' ) ); ?>"><?php esc_html_e( 'Destinations', 'wandermetric' ); ?></a></li>
				<?php foreach ( $nav as $slug ) : ?>
					<?php if ( isset( $sections[ $slug ] ) ) : ?>
						<li><a href="<?php echo esc_url( wm_section_url( $slug ) ); ?>"<?php echo get_query_var( 'wm_s' ) === $slug ? ' aria-current="page"' : ''; ?>><?php echo esc_html( $sections[ $slug ]['short'] ); ?></a></li>
					<?php endif; ?>
				<?php endforeach; ?>
				<li><a href="<?php echo esc_url( home_url( '/compare' ) ); ?>"<?php echo in_array( get_query_var( 'wm_route' ), array( 'compare', 'compare-section' ), true ) ? ' aria-current="page"' : ''; ?>><?php esc_html_e( 'Compare', 'wandermetric' ); ?></a></li>
			</ul>
		</nav>
		<form class="mastsearch" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
			<label class="sr-only" for="mastsearch-q"><?php esc_html_e( 'Search offers', 'wandermetric' ); ?></label>
			<input id="mastsearch-q" type="search" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Search a place or a ticket', 'wandermetric' ); ?>">
		</form>
	</div>
</header>
<main id="main">
