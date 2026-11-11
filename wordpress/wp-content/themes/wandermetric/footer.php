<?php
/**
 * Site footer, espresso ground.
 *   1. Brand band: the reversed logo, the promise in one sentence, three proofs.
 *   2. Five columns: Sections · Destinations (two-column list) · Compare · Company · Legal.
 *   3. Base: the affiliate disclosure in full, then copyright, cookie settings, back to top.
 * Links to pages are resolved by slug, so a renamed menu cannot break them.
 * No analytics or third-party request comes from here.
 */

defined( 'ABSPATH' ) || exit;

$sections  = function_exists( 'wm_sections' ) ? wm_sections() : array();
$countries = function_exists( 'wm_countries_with_offers' ) ? wm_countries_with_offers() : array();
$compare   = function_exists( 'wm_partner_data' ) ? wm_partner_data()['compare'] : array();

$page_link = static function ( string $slug, string $label ): string {
	$page = get_page_by_path( $slug );
	return $page && 'publish' === $page->post_status
		? '<li><a href="' . esc_url( get_permalink( $page ) ) . '">' . esc_html( $label ) . '</a></li>'
		: '';
};
$news_id = (int) get_option( 'page_for_posts' );
?>
</main>
<footer class="sitefoot">
	<div class="sitefoot-inner sitefoot-band">
		<div class="sitefoot-brand">
			<a class="wordmark" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="WanderMetric home"><?php echo wm_logo( 'reversed' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></a>
			<p><?php esc_html_e( 'Travel bookings, read before you pay: we go through each partner’s listing, write down what matters, and date the page.', 'wandermetric' ); ?></p>
		</div>
		<ul class="sitefoot-proofs" aria-label="<?php esc_attr_e( 'How every page is made', 'wandermetric' ); ?>">
			<li><?php echo wm_icon( 'check' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><span><strong><?php esc_html_e( 'Read from the partner', 'wandermetric' ); ?></strong> <?php esc_html_e( 'Facts come from the listing itself, never invented.', 'wandermetric' ); ?></span></li>
			<li><?php echo wm_icon( 'calendar' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><span><strong><?php esc_html_e( 'Dated', 'wandermetric' ); ?></strong> <?php esc_html_e( 'Every page says when its listing was read.', 'wandermetric' ); ?></span></li>
			<li><?php echo wm_icon( 'shield' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><span><strong><?php esc_html_e( 'You pay the partner', 'wandermetric' ); ?></strong> <?php esc_html_e( 'We never take your booking or your card.', 'wandermetric' ); ?></span></li>
		</ul>
	</div>

	<div class="sitefoot-inner sitefoot-cols">
		<nav class="sitefoot-col" aria-labelledby="ft-sections">
			<h2 id="ft-sections"><?php esc_html_e( 'Sections', 'wandermetric' ); ?></h2>
			<ul>
				<?php foreach ( $sections as $slug => $s ) : ?>
					<li><a href="<?php echo esc_url( wm_section_url( $slug ) ); ?>"><?php echo esc_html( $s['name'] ); ?></a></li>
				<?php endforeach; ?>
			</ul>
		</nav>

		<?php if ( $countries ) : ?>
		<nav class="sitefoot-col sitefoot-col--wide" aria-labelledby="ft-dest">
			<h2 id="ft-dest"><?php esc_html_e( 'Destinations', 'wandermetric' ); ?></h2>
			<ul class="sitefoot-two">
				<?php foreach ( $countries as $c ) : ?>
					<li><a href="<?php echo esc_url( wm_country_url( $c->slug ) ); ?>"><?php echo esc_html( $c->name ); ?></a></li>
				<?php endforeach; ?>
			</ul>
			<p class="sitefoot-more"><a href="<?php echo esc_url( home_url( '/countries' ) ); ?>"><?php esc_html_e( 'All destinations', 'wandermetric' ); ?> <?php echo wm_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a></p>
		</nav>
		<?php endif; ?>

		<?php if ( $compare ) : ?>
		<nav class="sitefoot-col" aria-labelledby="ft-compare">
			<h2 id="ft-compare"><?php esc_html_e( 'Compare', 'wandermetric' ); ?></h2>
			<ul>
				<?php foreach ( $compare as $c ) : ?>
					<li><a href="<?php echo esc_url( home_url( '/compare/' . $c['slug'] ) ); ?>"><?php echo esc_html( $sections[ $c['slug'] ]['short'] ?? $c['name'] ); ?></a></li>
				<?php endforeach; ?>
				<li><a href="<?php echo esc_url( home_url( '/compare' ) ); ?>"><?php esc_html_e( 'All comparisons', 'wandermetric' ); ?></a></li>
			</ul>
		</nav>
		<?php endif; ?>

		<nav class="sitefoot-col" aria-labelledby="ft-company">
			<h2 id="ft-company"><?php esc_html_e( 'Company', 'wandermetric' ); ?></h2>
			<ul>
				<?php
				echo $page_link( 'about', __( 'About us', 'wandermetric' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in the closure.
				echo $news_id ? '<li><a href="' . esc_url( get_permalink( $news_id ) ) . '">' . esc_html__( 'Travel news', 'wandermetric' ) . '</a></li>' : '';
				echo $page_link( 'affiliate-disclosure', __( 'How we earn', 'wandermetric' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				echo $page_link( 'contact', __( 'Contact', 'wandermetric' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				?>
			</ul>
		</nav>

		<nav class="sitefoot-col" aria-labelledby="ft-legal">
			<h2 id="ft-legal"><?php esc_html_e( 'Legal', 'wandermetric' ); ?></h2>
			<ul>
				<?php
				echo $page_link( 'privacy', __( 'Privacy', 'wandermetric' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				echo $page_link( 'terms', __( 'Terms of use', 'wandermetric' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				echo $page_link( 'affiliate-disclosure', __( 'Affiliate disclosure', 'wandermetric' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				?>
				<li><a href="#cookies" data-wm-consent-open><?php esc_html_e( 'Cookie settings', 'wandermetric' ); ?></a></li>
			</ul>
		</nav>
	</div>

	<div class="sitefoot-inner sitefoot-base">
		<p class="sitefoot-disclosure"><?php esc_html_e( 'Links to partners are affiliate links: if you book, the partner may pay us a commission, at no extra cost to you. Prices and availability are set by the partner and can change after the date shown on each page.', 'wandermetric' ); ?></p>
		<div class="sitefoot-legal">
			<p>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> WanderMetric. <?php esc_html_e( 'All rights reserved.', 'wandermetric' ); ?></p>
			<a class="sitefoot-top" href="#main"><?php esc_html_e( 'Back to top', 'wandermetric' ); ?> <span aria-hidden="true">↑</span></a>
		</div>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
