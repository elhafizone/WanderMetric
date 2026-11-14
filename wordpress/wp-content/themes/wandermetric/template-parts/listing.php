<?php
/**
 * Shared listing page: a heading (over the place photo when there is one),
 * then offers in groups. Section pages group by place; place pages by section.
 *
 * A thousand offers do not fit on one page, so the biggest groups get a rail
 * of up to `per_group` cards with a link to the page that lists all of them,
 * and the remaining groups are listed by name in an index below. Only the
 * cards on screen are loaded.
 *
 * @var array{title: string, lede: string, photo: ?array, trail: array, groups: array, per_group?: int, max_groups?: int, index_title?: string, filters?: array, widget?: string, empty: string} $args
 */

defined( 'ABSPATH' ) || exit;

$groups     = $args['groups'];
$per_group  = (int) ( $args['per_group'] ?? 0 );
$max_groups = (int) ( $args['max_groups'] ?? 0 );
$rails      = $max_groups > 0 ? array_slice( $groups, 0, $max_groups ) : $groups;
$rest       = $max_groups > 0 ? array_slice( $groups, $max_groups ) : array();

// Load every card on the page in one query.
$ids = array();
foreach ( $rails as $g ) {
	$ids = array_merge( $ids, $per_group > 0 ? array_slice( $g['ids'], 0, $per_group ) : $g['ids'] );
}
$posts = array();
foreach ( wm_offers_by_id( $ids ) as $p ) {
	$posts[ $p->ID ] = $p;
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

<?php if ( ! $groups ) : ?>
	<p class="empty wrap"><?php echo esc_html( $args['empty'] ); ?></p>
<?php endif; ?>

<?php foreach ( $rails as $g ) : ?>
	<?php
	$shown = $per_group > 0 ? array_slice( $g['ids'], 0, $per_group ) : $g['ids'];
	$more  = $g['url'] && count( $shown ) < $g['count'];
	?>
	<section class="rail wrap" aria-label="<?php echo esc_attr( $g['label'] ); ?>">
		<div class="rail-head">
			<h2><?php echo esc_html( $g['label'] ); ?></h2>
			<?php if ( $more ) : ?>
				<a class="more" href="<?php echo esc_url( $g['url'] ); ?>"><?php echo esc_html( sprintf( /* translators: %d: number of offers */ __( 'All %d offers', 'wandermetric' ), $g['count'] ) ); ?></a>
			<?php else : ?>
				<p><?php echo esc_html( sprintf( _n( '%d offer', '%d offers', $g['count'], 'wandermetric' ), $g['count'] ) ); ?></p>
			<?php endif; ?>
		</div>
		<div class="rail-grid">
			<?php
			foreach ( $shown as $id ) {
				if ( isset( $posts[ $id ] ) ) {
					wm_offer_card( $posts[ $id ] );
				}
			}
			?>
		</div>
	</section>
<?php endforeach; ?>

<?php if ( $rest ) : ?>
	<section class="place-index wrap" aria-labelledby="place-index-h">
		<h2 id="place-index-h"><?php echo esc_html( $args['index_title'] ?? __( 'More places', 'wandermetric' ) ); ?></h2>
		<ul>
			<?php foreach ( $rest as $g ) : ?>
				<li>
					<?php if ( $g['url'] ) : ?>
						<a href="<?php echo esc_url( $g['url'] ); ?>"><span><?php echo esc_html( $g['label'] ); ?></span> <span class="place-index-n"><?php echo (int) $g['count']; ?></span></a>
					<?php else : ?>
						<span><?php echo esc_html( $g['label'] ); ?></span> <span class="place-index-n"><?php echo (int) $g['count']; ?></span>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
	</section>
<?php endif; ?>
