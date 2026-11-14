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

/** Seconds one background run may spend importing before it hands over to the next. */
const WM_BUNDLE_BATCH_SECONDS = 240;

/**
 * One background run. A thousand offers with an image each take far longer
 * than a shared host lets one PHP request live, so a run imports for
 * WM_BUNDLE_BATCH_SECONDS, saves its place, and schedules the next run; the
 * bundle counts as imported only when nothing is left.
 */
function wm_run_bundle_import(): void {
	$hash = wm_bundle_hash();
	if ( '' === $hash || get_transient( 'wm_bundle_lock' ) ) {
		return;
	}
	set_transient( 'wm_bundle_lock', 1, 10 * MINUTE_IN_SECONDS );
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( WM_BUNDLE_BATCH_SECONDS + 120 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}
	// New cities and countries must exist before offers are filed under them.
	wm_maybe_seed_places();

	$started = time();
	$log     = array_slice( (array) ( get_option( 'wm_bundle_log' )['lines'] ?? array() ), -100 );
	if ( get_option( 'wm_bundle_run_hash' ) !== $hash ) {
		$log = array();
		update_option( 'wm_bundle_run_hash', $hash, false );
	}
	$seen    = (array) get_option( 'wm_bundle_files', array() );
	$todo    = array();
	$present = array();

	foreach ( glob( wm_bundle_dir() . '/*/*.json' ) ?: array() as $file ) {
		$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
		$slug = is_array( $data ) ? (string) ( $data['slug'] ?? '' ) : '';
		if ( '' === $slug ) {
			$log[] = 'skipped (no slug): ' . basename( $file );
			continue;
		}
		$present[ $slug ] = true;
		$md5              = md5_file( $file );
		if ( ( $seen[ $slug ] ?? '' ) === $md5 ) {
			continue;
		}
		// First run on a site that already holds this offer, published: record it, don't re-import.
		// A draft is not skipped: it may be one a stopped run left half-imported.
		if ( ! isset( $seen[ $slug ] ) ) {
			$existing = get_page_by_path( $slug, OBJECT, 'wm_offer' );
			if ( $existing && 'publish' === $existing->post_status ) {
				$seen[ $slug ] = $md5;
				continue;
			}
		}
		$todo[ $slug ] = array( $file, $md5 );
	}

	wm_withdraw_missing_offers( $seen, $present, $log );

	$importer = new WM_Offer_Importer(
		static function ( string $level, string $message ) use ( &$log ): void {
			$log[] = $level . ': ' . $message;
		}
	);
	$options = array( 'publish' => true );
	$legacy  = WM_CORE_DIR . 'data/legacy-offers.mjs';
	if ( is_file( $legacy ) ) {
		$options['legacy-list'] = $legacy;
	}
	$done = 0;
	foreach ( $todo as $slug => [ $file, $md5 ] ) {
		if ( time() - $started > WM_BUNDLE_BATCH_SECONDS ) {
			break;
		}
		try {
			$importer->import( array( $file ), $options );
		} catch ( Throwable $e ) {
			$log[] = 'error: ' . $slug . ': ' . $e->getMessage();
		}
		// Saved per offer, failures included, so a broken file is not retried forever. A run the
		// host stops mid-offer never reaches this line, so that offer is imported again next run.
		$seen[ $slug ] = $md5;
		update_option( 'wm_bundle_files', $seen, false );
		$done++;
	}

	$left = count( $todo ) - $done;
	update_option( 'wm_bundle_files', $seen, false );
	if ( $left > 0 ) {
		$log[] = sprintf( 'info: %d imported in this run, %d left; the next run starts in a minute.', $done, $left );
		wp_schedule_single_event( time() + MINUTE_IN_SECONDS, 'wm_import_bundle' );
	} else {
		update_option( 'wm_bundle_imported', $hash, false );
	}
	update_option(
		'wm_bundle_log',
		array(
			'at'    => current_time( 'mysql', true ),
			'files' => $done,
			'left'  => $left,
			'lines' => array_slice( $log, -200 ),
		),
		false
	);
	delete_transient( 'wm_bundle_lock' );
	do_action( 'litespeed_purge_all' );
}

/**
 * A catalogue offer whose file left the bundle (its product left the partner's
 * data) goes back to draft. Hand-written offers are never withdrawn this way.
 * If the bundle suddenly holds far fewer files than last time, nothing is
 * withdrawn: that is a broken bundle, not a thousand discontinued products.
 *
 * @param array<string, string> $seen    slug → md5, updated in place
 * @param array<string, bool>   $present slugs in this bundle
 * @param string[]              $log     updated in place
 */
function wm_withdraw_missing_offers( array &$seen, array $present, array &$log ): void {
	$gone = array_diff_key( $seen, $present );
	if ( ! $gone ) {
		return;
	}
	if ( count( $present ) < count( $seen ) / 2 ) {
		$log[] = sprintf( 'warning: the bundle has %d offers, last time %d; nothing withdrawn. Rebuild it with bundle-offers.sh.', count( $present ), count( $seen ) );
		return;
	}
	foreach ( array_keys( $gone ) as $slug ) {
		$post = get_page_by_path( (string) $slug, OBJECT, 'wm_offer' );
		if ( $post && 'catalogue' === wm_offer_tier( $post->ID ) && 'publish' === $post->post_status ) {
			wp_update_post(
				array(
					'ID'          => $post->ID,
					'post_status' => 'draft',
				)
			);
			$log[] = "info: {$slug} withdrawn: no longer in the partner's data.";
		} elseif ( $post && 'publish' === $post->post_status ) {
			$log[] = "info: {$slug}: its file is gone; a hand-written offer stays published until someone unpublishes it.";
		}
		unset( $seen[ $slug ] );
	}
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
	printf( '<p>%s UTC · %d file(s) imported in the last run · %d left</p><pre style="white-space:pre-wrap;background:#fff;padding:1em;border:1px solid #ddd">%s</pre></div>', esc_html( (string) $log['at'] ), (int) $log['files'], (int) ( $log['left'] ?? 0 ), esc_html( implode( "\n", (array) $log['lines'] ) ) );
}
