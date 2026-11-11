<?php
/**
 * Home: a place-led opener, the destination atlas, offers grouped by place,
 * the ten sections as an index, and how pages are made.
 */

defined( 'ABSPATH' ) || exit;
get_header();

$sections = wm_sections();
$hero     = wm_place_photo( 'home' );
$latest   = wm_get_offers( array( 'limit' => 60 ) );
$groups   = wm_group_by_place( $latest );
// The two places with the most offers get a rail on the home page.
uasort( $groups, static fn( $a, $b ) => count( $b ) <=> count( $a ) );
$rails = array_slice( $groups, 0, 2, true );
// Within a rail, offers with a partner photo lead; legacy ones without follow.
foreach ( $rails as &$rail_offers ) {
	usort( $rail_offers, static fn( $a, $b ) => (int) ! wm_offer_images( $a->ID ) <=> (int) ! wm_offer_images( $b->ID ) );
}
unset( $rail_offers );

// Destination tiles: cities and countries we have a licensed photo for and at least one offer in.
$tiles = array();
foreach ( array( 'paris' => 'france', 'rome' => 'italy', 'lisbon' => 'portugal', 'barcelona' => 'spain', 'tokyo' => 'japan' ) as $city => $country ) {
	$count = wm_count_offers( array( 'city' => $city ) );
	$photo = wm_place_photo( $city );
	$term  = wm_get_city( $country, $city );
	if ( $count && $photo && $term ) {
		$tiles[] = compact( 'city', 'country', 'count', 'photo', 'term' );
	}
}
?>
<section class="opener">
	<?php if ( $hero ) { wm_photo( $hero, '100vw', true, 'opener-photo' ); } ?>
	<div class="opener-text">
		<h1>Choose the place.<br>We’ve read the fine print.</h1>
		<p>Tickets, transfers, eSIMs and car hire for the cities you’re going to. Every page names the partner listing it was read from, and the date.</p>
		<form class="opener-search" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
			<label class="sr-only" for="opener-q">Search offers</label>
			<input id="opener-q" type="search" name="s" placeholder="Vatican tickets, Paris airport transfer, Japan eSIM">
			<button type="submit">Search</button>
		</form>
	</div>
</section>

<?php if ( $tiles ) : ?>
<section class="atlas wrap" aria-labelledby="atlas-h">
	<div class="atlas-head">
		<h2 id="atlas-h">Where to</h2>
		<a class="more" href="<?php echo esc_url( home_url( '/countries/' ) ); ?>">All destinations</a>
	</div>
	<ul class="atlas-grid">
		<?php foreach ( $tiles as $i => $t ) : ?>
			<li class="atlas-tile atlas-tile--<?php echo (int) $i; ?>">
				<a href="<?php echo esc_url( wm_country_url( $t['country'], $t['city'] ) ); ?>">
					<?php wm_photo( $t['photo'], 0 === $i ? '(min-width: 64rem) 50vw, 100vw' : '(min-width: 64rem) 25vw, 50vw', false, '', true ); ?>
					<span class="atlas-name"><?php echo esc_html( $t['term']->name ); ?></span>
					<span class="atlas-count"><?php echo esc_html( sprintf( _n( '%d offer', '%d offers', $t['count'], 'wandermetric' ), $t['count'] ) ); ?></span>
				</a>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
<?php endif; ?>

<?php foreach ( $rails as $place => $offers ) : ?>
<section class="rail wrap" aria-label="<?php echo esc_attr( 'In ' . $place ); ?>">
	<div class="rail-head">
		<h2>In <?php echo esc_html( $place ); ?></h2>
		<p>Sorted by place, not by provider.</p>
	</div>
	<div class="rail-grid">
		<?php
		foreach ( array_slice( $offers, 0, 4 ) as $offer ) {
			wm_offer_card( $offer );
		}
		?>
	</div>
</section>
<?php endforeach; ?>

<section class="index wrap" aria-labelledby="index-h">
	<h2 id="index-h">What you can book</h2>
	<ol class="index-list">
		<?php foreach ( $sections as $slug => $s ) : ?>
			<?php $n = wm_count_offers( array( 'section' => $slug ) ); ?>
			<li>
				<a href="<?php echo esc_url( wm_section_url( $slug ) ); ?>">
					<span class="index-name"><?php echo esc_html( $s['name'] ); ?></span>
					<span class="index-line"><?php echo esc_html( $s['tagline'] ); ?></span>
					<span class="index-count"><?php echo $n ? esc_html( (string) $n ) : '—'; ?></span>
				</a>
			</li>
		<?php endforeach; ?>
	</ol>
</section>

<section class="method">
	<div class="wrap method-inner">
		<h2>How a page is made</h2>
		<ol>
			<li><strong>We read the listing.</strong> On the partner’s own site, never a reseller.</li>
			<li><strong>We write down what matters.</strong> Meeting points, opening hours, cancellation, what is included.</li>
			<li><strong>We date it.</strong> Prices and rules change, so every page says when it was read.</li>
		</ol>
	</div>
</section>
<?php
get_footer();
