<?php
/**
 * Cookie consent. No third-party request leaves a page until the reader
 * chooses "Accept all": partner widgets (Travelpayouts) and, if a measurement
 * ID is set, Google Analytics with advertising features off.
 *
 * The choice is kept in the reader's browser only (localStorage plus a
 * first-party `wm_consent` cookie, 180 days). Nothing is sent to us.
 */

defined( 'ABSPATH' ) || exit;

/** Google Analytics measurement ID (G-XXXX), or '' for none. Set under Settings → General. */
function wm_ga_id(): string {
	$id = (string) get_option( 'wm_ga_id', '' );
	return preg_match( '/^G-[A-Z0-9]{4,}$/', $id ) ? $id : '';
}

add_action(
	'admin_init',
	static function () {
		register_setting(
			'general',
			'wm_ga_id',
			array(
				'type'              => 'string',
				'sanitize_callback' => static fn( $v ) => preg_match( '/^G-[A-Z0-9]{4,}$/', strtoupper( trim( (string) $v ) ) ) ? strtoupper( trim( (string) $v ) ) : '',
				'default'           => '',
			)
		);
		add_settings_field(
			'wm_ga_id',
			__( 'Google Analytics ID', 'wandermetric' ),
			static function () {
				printf(
					'<input name="wm_ga_id" id="wm_ga_id" class="regular-text" value="%s" placeholder="G-XXXXXXXXXX"><p class="description">%s</p>',
					esc_attr( wm_ga_id() ),
					esc_html__( 'Loaded only after a reader accepts cookies. Advertising features stay off.', 'wandermetric' )
				);
			},
			'general'
		);
	}
);

add_action(
	'wp_enqueue_scripts',
	static function () {
		wp_enqueue_script( 'wm-consent', plugins_url( 'assets/consent.js', WM_CORE_FILE ), array(), (string) filemtime( WM_CORE_DIR . 'assets/consent.js' ), array( 'strategy' => 'defer', 'in_footer' => true ) );
	}
);

add_action(
	'wp_footer',
	static function () {
		$privacy = get_privacy_policy_url();
		?>
<section class="consent" id="wm-consent" aria-label="<?php esc_attr_e( 'Cookie choice', 'wandermetric' ); ?>" data-ga-id="<?php echo esc_attr( wm_ga_id() ); ?>" hidden>
	<p class="consent-text"><strong><?php esc_html_e( 'Cookies, your call.', 'wandermetric' ); ?></strong>
	<?php esc_html_e( 'Essential cookies run the site. If you accept, we also load partner search forms (they set the partner’s own cookies) and Google Analytics with advertising features off.', 'wandermetric' ); ?>
	<?php if ( $privacy ) : ?><a href="<?php echo esc_url( $privacy ); ?>"><?php esc_html_e( 'Privacy', 'wandermetric' ); ?></a><?php endif; ?></p>
	<div class="consent-actions">
		<button type="button" class="consent-btn consent-btn--quiet" data-wm-consent="essential"><?php esc_html_e( 'Essential only', 'wandermetric' ); ?></button>
		<button type="button" class="consent-btn" data-wm-consent="all"><?php esc_html_e( 'Accept all', 'wandermetric' ); ?></button>
	</div>
</section>
		<?php
	},
	5
);
