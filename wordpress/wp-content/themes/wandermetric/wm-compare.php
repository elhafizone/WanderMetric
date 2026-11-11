<?php
/**
 * /compare : the categories, each with the providers we work with in it.
 * A provider is listed only while its link works (wm_live_partners).
 */

defined( 'ABSPATH' ) || exit;
get_header();
?>
<header class="place-head">
	<div class="place-text wrap">
		<?php wm_breadcrumbs( array( array( 'Home', home_url( '/' ) ), array( 'Compare', null ) ) ); ?>
		<h1>Compare</h1>
		<p>Choose a category. We compare providers within it, because a flight can’t be set against an eSIM.</p>
	</div>
</header>
<ul class="compare-index wrap">
	<?php foreach ( wm_partner_data()['compare'] as $c ) : ?>
		<?php
		$all  = wm_partner_data()['partners'][ $c['partnerCategory'] ] ?? array();
		$live = wm_live_partners( $c['partnerCategory'] );
		$show = $live ?: $all;
		?>
		<li class="compare-cat">
			<a href="<?php echo esc_url( home_url( user_trailingslashit( 'compare/' . $c['slug'] ) ) ); ?>">
				<span class="compare-count"><?php echo esc_html( sprintf( _n( '%d provider', '%d providers', count( $show ), 'wandermetric' ), count( $show ) ) ); ?></span>
				<h2><?php echo esc_html( $c['name'] ); ?></h2>
				<p><?php echo esc_html( $c['summary'] ); ?></p>
				<span class="compare-names"><?php echo esc_html( implode( ' · ', array_column( $show, 'name' ) ) ); ?></span>
				<span class="compare-go">Compare <?php echo esc_html( strtolower( wm_sections()[ $c['slug'] ]['short'] ) ); ?> <?php echo wm_icon( 'arrow' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
			</a>
		</li>
	<?php endforeach; ?>
</ul>
<?php
get_footer();
