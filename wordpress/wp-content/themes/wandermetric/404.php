<?php
/**
 * Not found.
 */

defined( 'ABSPATH' ) || exit;
get_header();
?>
<header class="place-head">
	<div class="place-text wrap">
		<h1>This page isn’t on the map</h1>
		<p>It may have moved when the site was reorganised. Try a destination or search for what you need.</p>
		<p><a class="btn btn--quiet" href="<?php echo esc_url( home_url( '/countries/' ) ); ?>">See destinations</a></p>
	</div>
</header>
<?php
get_footer();
