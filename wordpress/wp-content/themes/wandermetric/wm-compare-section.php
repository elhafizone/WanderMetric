<?php
/**
 * /compare/{section} : the providers in one category, what each says about
 * itself, what to check before booking, and the offers we have read in it.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$slug     = (string) get_query_var( 'wm_s' );
$c        = wm_compare_section( $slug );
$partners = wm_live_partners( $c['partnerCategory'] );
$from     = '/compare/' . $slug;
$offers   = wm_get_offers( array( 'section' => $slug, 'limit' => 8 ) );
?>
<header class="place-head">
	<div class="place-text wrap">
		<?php wm_breadcrumbs( array( array( 'Home', home_url( '/' ) ), array( 'Compare', home_url( user_trailingslashit( 'compare' ) ) ), array( $c['name'], null ) ) ); ?>
		<h1>Compare <?php echo esc_html( strtolower( $c['name'] ) ); ?></h1>
		<p>Providers in this category only. Compare on their sites; you book with the provider.</p>
	</div>
</header>

<div class="compare-body wrap">
	<div class="compare-main">
		<?php if ( $partners ) : ?>
			<h2 class="compare-h">Providers we work with</h2>
			<ul class="providers">
				<?php foreach ( $partners as $p ) : ?>
					<li class="provider">
						<span class="provider-mark" aria-hidden="true"><?php echo esc_html( mb_substr( $p['name'], 0, 1 ) ); ?></span>
						<div class="provider-text">
							<span class="chip"><?php echo esc_html( $p['kind'] ); ?></span>
							<h3><?php echo esc_html( $p['name'] ); ?></h3>
							<p><?php echo esc_html( $p['summary'] ); ?></p>
							<?php if ( ! empty( $p['points'] ) ) : ?>
								<ul class="provider-points"><?php foreach ( $p['points'] as $pt ) : ?><li><?php echo wm_icon( 'check' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><?php echo esc_html( $pt ); ?></li><?php endforeach; ?></ul>
							<?php endif; ?>
						</div>
						<a class="btn-cta provider-go" href="<?php echo esc_url( wm_partner_go_url( $p, $from ) ); ?>" rel="sponsored nofollow noopener" target="_blank">Visit <?php echo esc_html( $p['name'] ); ?> <?php echo wm_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><span class="sr-only"> (opens in a new tab)</span></a>
					</li>
				<?php endforeach; ?>
			</ul>
		<?php else : ?>
			<p class="empty">The provider links for this category are not switched on yet.</p>
		<?php endif; ?>

		<?php echo wm_widget_slot( 'section:' . $slug ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside. ?>
	</div>

	<aside class="compare-aside">
		<div class="note note--warn note--aside">
			<?php echo wm_icon( 'alert' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<div>
				<h2><?php echo esc_html( $c['checklistTitle'] ); ?></h2>
				<ul class="checklist"><?php foreach ( $c['checklist'] as $item ) : ?><li><?php echo esc_html( $item ); ?></li><?php endforeach; ?></ul>
			</div>
		</div>
	</aside>
</div>

<?php if ( $offers ) : ?>
	<section class="rail wrap" aria-label="Guides in this category">
		<div class="rail-head"><h2>Guides in <?php echo esc_html( strtolower( $c['name'] ) ); ?></h2><a class="more" href="<?php echo esc_url( wm_section_url( $slug ) ); ?>">All <?php echo esc_html( strtolower( $c['name'] ) ); ?></a></div>
		<div class="rail-grid">
			<?php
			foreach ( array_slice( $offers, 0, 4 ) as $o ) {
				wm_offer_card( $o );
			}
			?>
		</div>
	</section>
<?php endif; ?>
<?php
get_footer();
