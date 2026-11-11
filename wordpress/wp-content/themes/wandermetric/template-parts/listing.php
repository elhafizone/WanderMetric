<?php
/**
 * Shared listing page: a heading (over the place photo when there is one),
 * then offers in groups. Section pages group by place; place pages by section.
 *
 * @var array{title: string, lede: string, photo: ?array, trail: array, offers: WP_Post[], group_by: string, filters?: array, empty: string} $args
 */

defined( 'ABSPATH' ) || exit;

$offers   = $args['offers'];
$sections = wm_sections();
$groups   = array();
if ( 'section' === $args['group_by'] ) {
	// Groups follow the fixed order of the ten sections.
	foreach ( $sections as $slug => $section ) {
		$items = array_values( array_filter( $offers, static fn( $o ) => wm_offer_section( $o->ID ) === $slug ) );
		if ( $items ) {
			$groups[ $section['name'] ] = $items;
		}
	}
} else {
	// Places with the most offers first.
	$groups = wm_group_by_place( $offers );
	uasort( $groups, static fn( $a, $b ) => count( $b ) <=> count( $a ) );
}
?>
<header class="place-head<?php echo $args['photo'] ? ' place-head--photo' : ''; ?>">
	<?php if ( $args['photo'] ) { wm_photo( $args['photo'], '100vw', true, 'place-photo' ); } ?>
	<div class="place-text wrap">
		<?php wm_breadcrumbs( $args['trail'] ); ?>
		<h1><?php echo esc_html( $args['title'] ); ?></h1>
		<?php if ( $args['lede'] ) : ?><p><?php echo esc_html( $args['lede'] ); ?></p><?php endif; ?>
	</div>
</header>

<?php if ( ! empty( $args['filters'] ) ) : ?>
	<nav class="filters wrap" aria-label="Filter">
		<ul>
			<?php foreach ( $args['filters'] as [ $label, $url, $current ] ) : ?>
				<li><a href="<?php echo esc_url( $url ); ?>"<?php echo $current ? ' aria-current="page"' : ''; ?>><?php echo esc_html( $label ); ?></a></li>
			<?php endforeach; ?>
		</ul>
	</nav>
<?php endif; ?>

<?php if ( ! empty( $args['widget'] ) ) : ?>
	<div class="wrap"><?php echo $args['widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built and escaped by wm_widget_slot(). ?></div>
<?php endif; ?>

<?php if ( ! $offers ) : ?>
	<p class="empty wrap"><?php echo esc_html( $args['empty'] ); ?></p>
<?php endif; ?>

<?php foreach ( $groups as $label => $items ) : ?>
	<section class="rail wrap" aria-label="<?php echo esc_attr( $label ); ?>">
		<div class="rail-head"><h2><?php echo esc_html( $label ); ?></h2><p><?php echo esc_html( sprintf( _n( '%d offer', '%d offers', count( $items ), 'wandermetric' ), count( $items ) ) ); ?></p></div>
		<div class="rail-grid">
			<?php
			foreach ( $items as $o ) {
				wm_offer_card( $o );
			}
			?>
		</div>
	</section>
<?php endforeach; ?>
