<?php
/**
 * Site footer: sections, countries and the affiliate disclosure.
 * No analytics loads yet; the consent notice comes with Google Analytics.
 */

defined( 'ABSPATH' ) || exit;
$sections  = function_exists( 'wm_sections' ) ? wm_sections() : array();
$countries = function_exists( 'wm_countries_with_offers' ) ? wm_countries_with_offers() : array();
?>
</main>
<footer class="sitefoot">
	<div class="sitefoot-inner">
		<div class="sitefoot-brand">
			<a class="wordmark" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo wm_logo( 'reversed' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></a>
			<p><?php esc_html_e( 'We read each partner listing, write down what matters, and date the page. You book on the partner’s site.', 'wandermetric' ); ?></p>
		</div>
		<nav aria-label="<?php esc_attr_e( 'Sections', 'wandermetric' ); ?>">
			<h2><?php esc_html_e( 'Sections', 'wandermetric' ); ?></h2>
			<ul>
				<?php foreach ( $sections as $slug => $s ) : ?>
					<li><a href="<?php echo esc_url( wm_section_url( $slug ) ); ?>"><?php echo esc_html( $s['name'] ); ?></a></li>
				<?php endforeach; ?>
			</ul>
		</nav>
		<?php if ( $countries ) : ?>
		<nav aria-label="<?php esc_attr_e( 'Destinations', 'wandermetric' ); ?>">
			<h2><?php esc_html_e( 'Destinations', 'wandermetric' ); ?></h2>
			<ul>
				<?php foreach ( $countries as $c ) : ?>
					<li><a href="<?php echo esc_url( wm_country_url( $c->slug ) ); ?>"><?php echo esc_html( $c->name ); ?></a></li>
				<?php endforeach; ?>
			</ul>
		</nav>
		<?php endif; ?>
		<nav aria-label="<?php esc_attr_e( 'Company and legal', 'wandermetric' ); ?>">
			<h2><?php esc_html_e( 'Company', 'wandermetric' ); ?></h2>
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'footer',
					'container'      => false,
					'depth'          => 1,
					'fallback_cb'    => false,
				)
			);
			?>
		</nav>
	</div>
	<p class="disclosure sitefoot-inner"><a href="#cookies" data-wm-consent-open><?php esc_html_e( 'Cookie settings', 'wandermetric' ); ?></a> ·<?php esc_html_e( 'Links to partners are affiliate links: if you book, the partner may pay us a commission at no extra cost to you. Prices and availability are set by the partner and can change after the date shown on each page.', 'wandermetric' ); ?></p>
</footer>
<?php wp_footer(); ?>
</body>
</html>
