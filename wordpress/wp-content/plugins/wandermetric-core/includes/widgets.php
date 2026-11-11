<?php
/**
 * Travelpayouts widgets, loaded only after consent.
 *
 * Every preset below was copied from the Travelpayouts dashboard
 * (Tools → Widgets → "Customize and copy", account 705982, project
 * "Wandermetric" trs=512658) on 2026-11-11. Only the colour parameters were
 * changed to Lagoon, which the dashboard itself lets you customise.
 * Never write a widget URL from memory: copy it from the dashboard.
 *
 * Where a widget appears is a placement ("section:flights", "city:rome",
 * "country:japan"). Defaults are set here; Offers → Widgets overrides them.
 */

defined( 'ABSPATH' ) || exit;

const WM_TP_MARKER  = '705982';
const WM_TP_PROJECT = '512658';

/**
 * @return array<string, array{partner: string, label: string, src: string, needs_place: bool}>
 */
function wm_widget_presets(): array {
	$base = 'https://tpemd.com/content?trs=' . WM_TP_PROJECT . '&shmarker=' . WM_TP_MARKER;
	return array(
		'aviasales-search'    => array(
			'partner'     => 'Aviasales',
			'label'       => 'Flight search',
			'layout'      => 'wide',
			'src'         => $base . '&currency=usd&show_hotels=true&powered_by=true&primary_override=%230b6660&color_button=%230b6660&color_icons=%230b6660&dark=%231c1a17&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%230b6660&border_radius=12&plain=false&promo_id=7879&campaign_id=100',
			'needs_place' => false,
		),
		'welcome-pickups'     => array(
			'partner'     => 'Welcome Pickups',
			'label'       => 'Airport transfer search',
			'layout'      => 'compact',
			'src'         => $base . '&locale=en&show_header=true&powered_by=true&campaign_id=627&promo_id=8951',
			'needs_place' => false,
		),
		'airalo-esim'         => array(
			'partner'     => 'Airalo',
			'label'       => 'eSIM search',
			'layout'      => 'compact',
			'src'         => $base . '&locale=en&powered_by=true&color_button=%230b6660&color_focused=%230b6660&secondary=%23FFFFFF&dark=%231c1a17&light=%23FFFFFF&special=%23C4C4C4&border_radius=12&plain=false&no_labels=true&promo_id=8588&campaign_id=541',
			'needs_place' => false,
		),
		'airhelp-compensation' => array(
			'partner'     => 'AirHelp',
			'label'       => 'Flight compensation check',
			'layout'      => 'compact',
			'src'         => $base . '&lang=en&powered_by=true&campaign_id=120&promo_id=8679',
			'needs_place' => false,
		),
		// The two below carry a place picked in the dashboard (Localrent city=264341,
		// Klook city_id=4). Configure the city there, paste the code under
		// Offers → Widgets for that city, then it shows.
		'localrent-search'    => array(
			'partner'     => 'Localrent',
			'label'       => 'Car rental search',
			'layout'      => 'compact',
			'src'         => $base . '&powered_by=true&country=2&city=264341&lang=en&width=100&background=light&logo=true&header=true&gearbox=false&cars=false&border=true&footer=true&campaign_id=87&promo_id=4322',
			'needs_place' => true,
		),
		'klook-city-tours'    => array(
			'partner'     => 'Klook',
			'label'       => 'Tours in the city',
			'layout'      => 'compact',
			'src'         => $base . '&currency=USD&locale=en&city_id=4&category=4&amount=3&powered_by=true&campaign_id=137&promo_id=4497',
			'needs_place' => true,
		),
	);
}

/** Placements that ship with the site. */
function wm_widget_default_placements(): array {
	return array(
		'section:flights'         => 'aviasales-search',
		'section:transfers'       => 'welcome-pickups',
		'section:sim-cards'       => 'airalo-esim',
		'section:travel-services' => 'airhelp-compensation',
	);
}

/** Placements editors may set on the settings page. */
function wm_widget_placement_keys(): array {
	$keys = array();
	foreach ( wm_sections() as $slug => $s ) {
		$keys[ 'section:' . $slug ] = 'Section: ' . $s['name'];
	}
	foreach ( wm_seed_place_list() as $country => $c ) {
		$keys[ 'country:' . $country ] = 'Country: ' . $c['name'];
		foreach ( $c['cities'] as $city => $name ) {
			$keys[ 'city:' . $city ] = 'City: ' . $name;
		}
	}
	return $keys;
}

/**
 * Validate a widget: a Travelpayouts embed on tpemd.com carrying our marker.
 * Accepts the full <script> tag from the dashboard or the bare URL.
 */
function wm_widget_clean_src( string $input ): ?string {
	$input = trim( wp_unslash( $input ) );
	if ( '' === $input ) {
		return null;
	}
	if ( preg_match( '/src\s*=\s*["\']([^"\']+)["\']/i', $input, $m ) ) {
		$input = html_entity_decode( $m[1] );
	}
	$parts = wp_parse_url( $input );
	if ( ! $parts || 'https' !== ( $parts['scheme'] ?? '' ) || 'tpemd.com' !== ( $parts['host'] ?? '' ) || empty( $parts['query'] ) ) {
		return null;
	}
	parse_str( $parts['query'], $q );
	if ( ( $q['shmarker'] ?? '' ) !== WM_TP_MARKER || empty( $q['promo_id'] ) ) {
		return null;
	}
	return 'https://tpemd.com' . ( $parts['path'] ?? '/content' ) . '?' . $parts['query'];
}

/**
 * The widget for a placement: [src, partner, label] or null.
 *
 * @return array{src: string, partner: string, label: string}|null
 */
function wm_widget_for( string $placement ): ?array {
	$custom = (array) get_option( 'wm_widget_placements', array() );
	if ( ! empty( $custom[ $placement ]['src'] ) ) {
		return array(
			'src'     => $custom[ $placement ]['src'],
			'partner' => $custom[ $placement ]['partner'] ?: 'the partner',
			'label'   => $custom[ $placement ]['label'] ?: 'Search',
			'layout'  => 'compact',
		);
	}
	$preset_key = wm_widget_default_placements()[ $placement ] ?? null;
	$preset     = $preset_key ? wm_widget_presets()[ $preset_key ] : null;
	return $preset && ! $preset['needs_place'] ? array(
		'src'     => $preset['src'],
		'partner' => $preset['partner'],
		'label'   => $preset['label'],
		'layout'  => $preset['layout'] ?? 'compact',
	) : null;
}

/** Render the consent-gated slot. Returns '' when the placement has no widget. */
function wm_widget_slot( string $placement, string $heading = '' ): string {
	$w = wm_widget_for( $placement );
	return $w ? wm_widget_render( $w, $heading ) : '';
}

/** @param array{src: string, partner: string, label: string} $w */
function wm_widget_render( array $w, string $heading = '' ): string {
	$heading = $heading ?: $w['label'];
	ob_start();
	?>
<section class="wm-widget wm-widget--<?php echo esc_attr( ( $w['layout'] ?? 'compact' ) === 'wide' ? 'wide' : 'compact' ); ?>" data-wm-widget-src="<?php echo esc_url( $w['src'] ); ?>" aria-label="<?php echo esc_attr( $heading ); ?>">
	<div class="wm-widget-head">
		<h2><?php echo esc_html( $heading ); ?></h2>
		<p><?php echo esc_html( sprintf( 'Run by %s. Results and prices come from them, live.', $w['partner'] ) ); ?></p>
		<ul class="wm-widget-notes">
			<li><?php echo esc_html( sprintf( 'What you type goes to %s, not to us.', $w['partner'] ) ); ?></li>
			<li><?php echo esc_html( sprintf( 'You book and pay on %s’s site.', $w['partner'] ) ); ?></li>
		</ul>
	</div>
	<div class="wm-widget-mount"></div>
	<div class="wm-widget-gate">
		<p><?php echo esc_html( sprintf( 'This search form loads from %s and sets their cookies, so it appears once you accept cookies.', $w['partner'] ) ); ?></p>
		<button type="button" class="consent-btn" data-wm-consent="all"><?php esc_html_e( 'Accept cookies and show it', 'wandermetric' ); ?></button>
	</div>
</section>
	<?php
	return (string) ob_get_clean();
}

/** [wm_widget preset="airalo-esim"] or [wm_widget placement="city:rome"] inside post content. */
add_shortcode(
	'wm_widget',
	static function ( $atts ) {
		$atts = shortcode_atts( array( 'preset' => '', 'placement' => '', 'title' => '' ), (array) $atts );
		if ( $atts['placement'] ) {
			return wm_widget_slot( sanitize_text_field( $atts['placement'] ), sanitize_text_field( $atts['title'] ) );
		}
		$p = wm_widget_presets()[ sanitize_key( $atts['preset'] ) ] ?? null;
		// Place-bound presets need their city set in the dashboard first.
		return ( $p && ! $p['needs_place'] ) ? wm_widget_render( $p, sanitize_text_field( $atts['title'] ) ) : '';
	}
);

/* ---------- Settings page: Offers → Widgets ---------- */

add_action(
	'admin_menu',
	static function () {
		add_submenu_page( 'edit.php?post_type=wm_offer', __( 'Widgets', 'wandermetric' ), __( 'Widgets', 'wandermetric' ), 'manage_options', 'wm-widgets', 'wm_widgets_page' );
	}
);

function wm_widgets_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$saved  = (array) get_option( 'wm_widget_placements', array() );
	$notice = '';
	if ( isset( $_POST['wm_widgets_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['wm_widgets_nonce'] ) ), 'wm_widgets' ) ) {
		$errors = array();
		$new    = array();
		foreach ( wm_widget_placement_keys() as $key => $label ) {
			$field = 'wm_' . str_replace( array( ':', '-' ), '_', $key );
			$raw   = isset( $_POST[ $field ] ) ? (string) wp_unslash( $_POST[ $field ] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- validated by wm_widget_clean_src.
			if ( '' === trim( $raw ) ) {
				continue;
			}
			$src = wm_widget_clean_src( $raw );
			if ( ! $src ) {
				$errors[] = $label;
				continue;
			}
			$new[ $key ] = array(
				'src'     => $src,
				'partner' => sanitize_text_field( wp_unslash( $_POST[ $field . '_partner' ] ?? '' ) ),
				'label'   => sanitize_text_field( wp_unslash( $_POST[ $field . '_label' ] ?? '' ) ),
			);
		}
		update_option( 'wm_widget_placements', $new, false );
		$saved  = $new;
		$notice = $errors
			? '<div class="notice notice-error"><p>' . esc_html( 'Not saved for: ' . implode( ', ', $errors ) . '. Paste the code from the Travelpayouts dashboard: it must load from https://tpemd.com and carry shmarker=' . WM_TP_MARKER . '.' ) . '</p></div>'
			: '<div class="notice notice-success"><p>' . esc_html__( 'Widgets saved.', 'wandermetric' ) . '</p></div>';
	}
	$defaults = wm_widget_default_placements();
	$presets  = wm_widget_presets();
	echo '<div class="wrap"><h1>' . esc_html__( 'Widgets', 'wandermetric' ) . '</h1>' . wp_kses_post( $notice );
	echo '<p>' . esc_html__( 'Paste a widget code from Travelpayouts → Tools → Widgets → Customize and copy. Empty fields use the default shown. Widgets load only after the reader accepts cookies.', 'wandermetric' ) . '</p>';
	echo '<form method="post">';
	wp_nonce_field( 'wm_widgets', 'wm_widgets_nonce' );
	echo '<table class="form-table" role="presentation"><tbody>';
	foreach ( wm_widget_placement_keys() as $key => $label ) {
		$field   = 'wm_' . str_replace( array( ':', '-' ), '_', $key );
		$current = $saved[ $key ] ?? array( 'src' => '', 'partner' => '', 'label' => '' );
		$default = isset( $defaults[ $key ] ) ? $presets[ $defaults[ $key ] ]['partner'] . ' · ' . $presets[ $defaults[ $key ] ]['label'] : '—';
		printf(
			'<tr><th scope="row"><label for="%1$s">%2$s</label><p class="description">Default: %3$s</p></th><td><textarea id="%1$s" name="%1$s" rows="2" class="large-text code" placeholder="&lt;script async src=&quot;https://tpemd.com/content?…&quot;&gt;&lt;/script&gt;">%4$s</textarea><p><input name="%1$s_partner" value="%5$s" placeholder="Partner name" class="regular-text"> <input name="%1$s_label" value="%6$s" placeholder="Heading" class="regular-text"></p></td></tr>',
			esc_attr( $field ),
			esc_html( $label ),
			esc_html( $default ),
			esc_textarea( $current['src'] ),
			esc_attr( $current['partner'] ),
			esc_attr( $current['label'] )
		);
	}
	echo '</tbody></table>';
	submit_button( __( 'Save widgets', 'wandermetric' ) );
	echo '</form></div>';
}
