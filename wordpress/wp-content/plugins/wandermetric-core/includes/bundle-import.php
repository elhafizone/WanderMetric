<?php
/**
 * Importing offers on a server without WP-CLI.
 *
 * `wordpress/bundle-offers.sh` copies content/offers into this plugin's
 * data/offers/ and writes data/offers/.bundle (a hash of the files). After a
 * deploy, the first request that sees a new hash schedules one background
 * WP-Cron job. The job imports only files that are new or changed since the
 * last run (tracked per slug by content hash), publishing through the gate,
 * then purges LiteSpeed. Offers that already exist and are unchanged are never
 * touched, so their modified dates stay true.
 *
 * Last run summary: Offers → Import log.
 */

defined( 'ABSPATH' ) || exit;

function wm_bundle_dir(): string {
	return WM_CORE_DIR . 'data/offers';
}

function wm_bundle_hash(): string {
	$f = wm_bundle_dir() . '/.bundle';
	return is_file( $f ) ? trim( (string) file_get_contents( $f ) ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
}

add_action(
	'init',
	static function () {
		$hash = wm_bundle_hash();
		if ( '' === $hash || get_option( 'wm_bundle_imported' ) === $hash || wp_next_scheduled( 'wm_import_bundle' ) ) {
			return;
		}
		wp_schedule_single_event( time() + 5, 'wm_import_bundle' );
	},
	40
);

add_action( 'wm_import_bundle', 'wm_run_bundle_import' );

function wm_run_bundle_import(): void {
	$hash = wm_bundle_hash();
	if ( '' === $hash || get_transient( 'wm_bundle_lock' ) ) {
		return;
	}
	set_transient( 'wm_bundle_lock', 1, 15 * MINUTE_IN_SECONDS );
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 900 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}

	$log  = array();
	$seen = (array) get_option( 'wm_bundle_files', array() );
	$todo = array();

	foreach ( glob( wm_bundle_dir() . '/*/*.json' ) ?: array() as $file ) {
		$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
		$slug = is_array( $data ) ? (string) ( $data['slug'] ?? '' ) : '';
		if ( '' === $slug ) {
			$log[] = 'skipped (no slug): ' . basename( $file );
			continue;
		}
		$md5 = md5_file( $file );
		if ( ( $seen[ $slug ] ?? '' ) === $md5 ) {
			continue;
		}
		// First run on a site that already holds this offer: record it, don't re-import.
		if ( ! isset( $seen[ $slug ] ) && get_page_by_path( $slug, OBJECT, 'wm_offer' ) ) {
			$seen[ $slug ] = $md5;
			continue;
		}
		$todo[ $slug ] = array( $file, $md5 );
	}

	$importer = new WM_Offer_Importer(
		static function ( string $level, string $message ) use ( &$log ): void {
			$log[] = $level . ': ' . $message;
		}
	);
	foreach ( $todo as $slug => [ $file, $md5 ] ) {
		try {
			$importer->import( array( $file ), array( 'publish' => true ) );
			$seen[ $slug ] = $md5;
			// Saved per offer: if the host stops a long run, the next run resumes here.
			update_option( 'wm_bundle_files', $seen, false );
		} catch ( Throwable $e ) {
			$log[] = 'error: ' . $slug . ': ' . $e->getMessage();
		}
	}

	update_option( 'wm_bundle_files', $seen, false );
	update_option( 'wm_bundle_imported', $hash, false );
	update_option(
		'wm_bundle_log',
		array(
			'at'    => current_time( 'mysql', true ),
			'files' => count( $todo ),
			'lines' => array_slice( $log, -200 ),
		),
		false
	);
	delete_transient( 'wm_bundle_lock' );
	do_action( 'litespeed_purge_all' );
}

add_action(
	'admin_menu',
	static function () {
		add_submenu_page( 'edit.php?post_type=wm_offer', __( 'Import log', 'wandermetric' ), __( 'Import log', 'wandermetric' ), 'manage_options', 'wm-import-log', 'wm_import_log_page' );
	}
);

function wm_import_log_page(): void {
	$log = (array) get_option( 'wm_bundle_log', array() );
	echo '<div class="wrap"><h1>' . esc_html__( 'Import log', 'wandermetric' ) . '</h1>';
	if ( ! $log ) {
		echo '<p>' . esc_html__( 'No bundle import has run yet.', 'wandermetric' ) . '</p></div>';
		return;
	}
	printf( '<p>%s UTC · %d file(s) imported</p><pre style="white-space:pre-wrap;background:#fff;padding:1em;border:1px solid #ddd">%s</pre></div>', esc_html( (string) $log['at'] ), (int) $log['files'], esc_html( implode( "\n", (array) $log['lines'] ) ) );
}
